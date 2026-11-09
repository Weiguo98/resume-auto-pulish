import { randomBytes } from "node:crypto";
import type pg from "pg";
import type { Cv, PublishRecord, Version } from "../../shared/api.ts";
import { normalizeSite, type Site } from "../../shared/site.ts";
import { inTx, pool } from "../db/pool.ts";
import { NotFound } from "../errors.ts";

type Db = pg.Pool | pg.PoolClient;

export interface NewVersion {
  message: string;
  file?: string | null;
  reply: string;
  suggestions: string[];
  site: Site;
  startsChat?: boolean;
}

const toCv = (r: any): Cv => ({
  id: r.id,
  name: r.name,
  kind: r.kind,
  parentId: r.parent_id,
  jd: r.jd,
  stale: Boolean(r.stale),
  versionCount: Number(r.version_count),
});

const toVersion = (r: any): Version => ({
  id: r.id,
  seq: r.seq,
  message: r.message,
  file: r.file_name,
  reply: r.reply,
  suggestions: r.suggestions,
  site: normalizeSite(r.site),
  startsChat: r.starts_chat,
  createdAt: r.created_at.toISOString(),
});

const toPublish = (r: any): PublishRecord => ({
  id: r.id,
  cvId: r.cv_id,
  versionId: r.version_id,
  url: r.url,
  repo: r.repo,
  site: normalizeSite(r.site),
  createdAt: r.created_at.toISOString(),
});

// ---- users and sessions

export async function newSession(): Promise<{ id: string; userId: string }> {
  const id = randomBytes(32).toString("hex");
  return inTx(async (db) => {
    const { rows } = await db.query("insert into users default values returning id");
    await db.query("insert into sessions (id, user_id) values ($1, $2)", [id, rows[0].id]);
    return { id, userId: rows[0].id };
  });
}

export async function userForSession(sessionId: string): Promise<string | null> {
  const { rows } = await pool.query("select user_id from sessions where id = $1", [sessionId]);
  return rows[0]?.user_id ?? null;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await pool.query("delete from sessions where id = $1", [sessionId]);
}

export async function gitHubAccount(userId: string): Promise<{ login: string | null; token: string | null }> {
  const { rows } = await pool.query("select github_login, github_token from users where id = $1", [userId]);
  return { login: rows[0]?.github_login ?? null, token: rows[0]?.github_token ?? null };
}

// Signing in on a new browser: this session's anonymous user is merged into the user who already owns this GitHub account.
export async function linkGitHub(sessionId: string, userId: string, github: { id: number; login: string; token: string }): Promise<void> {
  await inTx(async (db) => {
    const { rows } = await db.query("select id from users where github_id = $1", [github.id]);
    const owner: string | undefined = rows[0]?.id;
    if (!owner || owner === userId) {
      await db.query("update users set github_id = $2, github_login = $3, github_token = $4 where id = $1", [userId, github.id, github.login, github.token]);
      return;
    }
    await db.query("update users set github_login = $2, github_token = $3 where id = $1", [owner, github.login, github.token]);
    await db.query(
      `delete from cvs c where c.user_id = $1 and c.kind = 'main' and not exists (select 1 from versions v where v.cv_id = c.id)`,
      [userId],
    );
    await db.query(`update cvs set kind = 'variant', name = 'Draft from another browser' where user_id = $1 and kind = 'main'`, [userId]);
    await db.query("update cvs set user_id = $2 where user_id = $1", [userId, owner]);
    await db.query("update sessions set user_id = $2 where id = $1", [sessionId, owner]);
    await db.query("delete from users where id = $1", [userId]);
  });
}

// ---- CVs

const CV_COLUMNS = `c.*,
  (select count(*) from versions v where v.cv_id = c.id) as version_count,
  c.kind = 'variant' and c.base_version_id is distinct from
    (select v.id from versions v where v.cv_id = c.parent_id order by v.seq desc limit 1) as stale`;

export async function listCvs(userId: string): Promise<Cv[]> {
  await pool.query(`insert into cvs (user_id, name, kind) values ($1, 'Main', 'main') on conflict (user_id) where kind = 'main' do nothing`, [
    userId,
  ]);
  const { rows } = await pool.query(`select ${CV_COLUMNS} from cvs c where c.user_id = $1 order by c.kind = 'main' desc, c.created_at`, [userId]);
  return rows.map(toCv);
}

export async function getCv(userId: string, cvId: string, db: Db = pool): Promise<Cv> {
  const { rows } = await db.query(`select ${CV_COLUMNS} from cvs c where c.user_id = $1 and c.id::text = $2`, [userId, cvId]);
  if (!rows[0]) throw new NotFound();
  return toCv(rows[0]);
}

export async function mainCv(userId: string): Promise<Cv> {
  const main = (await listCvs(userId)).find((c) => c.kind === "main");
  if (!main) throw new NotFound();
  return main;
}

export async function createVariant(userId: string, parentId: string, name: string, jd: string, baseVersionId: string, first: NewVersion) {
  return inTx(async (db) => {
    const { rows } = await db.query(
      `insert into cvs (user_id, name, kind, parent_id, jd, base_version_id) values ($1, $2, 'variant', $3, $4, $5) returning id`,
      [userId, name, parentId, jd, baseVersionId],
    );
    const version = await addVersion(rows[0].id, first, db);
    return { cv: await getCv(userId, rows[0].id, db), version };
  });
}

export async function retailored(cvId: string, baseVersionId: string, next: NewVersion): Promise<Version> {
  return inTx(async (db) => {
    await db.query("update cvs set base_version_id = $2 where id = $1", [cvId, baseVersionId]);
    return addVersion(cvId, next, db);
  });
}

export async function deleteVariant(userId: string, cvId: string): Promise<void> {
  await pool.query(`delete from cvs where user_id = $1 and id::text = $2 and kind = 'variant'`, [userId, cvId]);
}

// ---- versions

export async function listVersions(cvId: string): Promise<Version[]> {
  const { rows } = await pool.query("select * from versions where cv_id = $1 order by seq", [cvId]);
  return rows.map(toVersion);
}

export async function recentVersions(cvId: string, count: number): Promise<Version[]> {
  const { rows } = await pool.query("select * from versions where cv_id = $1 order by seq desc limit $2", [cvId, count]);
  return rows.reverse().map(toVersion);
}

export async function addVersion(cvId: string, v: NewVersion, db: Db = pool): Promise<Version> {
  const { rows } = await db.query(
    `insert into versions (cv_id, seq, message, file_name, reply, suggestions, site, starts_chat)
     values ($1, (select coalesce(max(seq), 0) + 1 from versions where cv_id = $1), $2, $3, $4, $5, $6, $7) returning *`,
    [cvId, v.message, v.file ?? null, v.reply, JSON.stringify(v.suggestions), JSON.stringify(v.site), v.startsChat ?? false],
  );
  return toVersion(rows[0]);
}

export async function deleteLastVersion(cvId: string): Promise<void> {
  await pool.query("delete from versions where id = (select id from versions where cv_id = $1 order by seq desc limit 1)", [cvId]);
}

// ---- publishes

export async function addPublish(cvId: string, version: Version, url: string, repo: string): Promise<void> {
  await pool.query("insert into publishes (cv_id, version_id, url, repo, site) values ($1, $2, $3, $4, $5)", [
    cvId,
    version.id,
    url,
    repo,
    JSON.stringify(version.site),
  ]);
}

export async function listPublishes(cvId: string): Promise<PublishRecord[]> {
  const { rows } = await pool.query("select * from publishes where cv_id = $1 order by created_at desc limit 50", [cvId]);
  return rows.map(toPublish);
}
