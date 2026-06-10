import { getAdminDb } from "./db";
import { AuthError, type SessionUser } from "./auth";

// 평가 점수 서버 로직.
//  * 점수: 0~100, 10점 단위. 글당 사용자별 1회. 수정 불가(unique + DB 트리거).
//  * 평가 권한: 슈퍼가 지정(can_rate) 또는 슈퍼 본인. 작성자 본인 글은 평가 불가.
//  * 공개: 평균 + 개수만. 열람 권한(can_view_scores) 또는 슈퍼만.
//  * 제도 on/off, 리셋: 슈퍼 전용.

export async function getRatingsEnabled(): Promise<boolean> {
  const db = getAdminDb();
  const { data } = await db
    .from("app_settings")
    .select("value")
    .eq("key", "ratings_enabled")
    .maybeSingle();
  return data?.value === true;
}

export async function setRatingsEnabled(enabled: boolean): Promise<void> {
  const db = getAdminDb();
  await db
    .from("app_settings")
    .upsert({ key: "ratings_enabled", value: enabled });
}

export async function getMyRating(
  userId: string,
  pageId: string
): Promise<number | null> {
  const db = getAdminDb();
  const { data } = await db
    .from("ratings")
    .select("score")
    .eq("page_id", pageId)
    .eq("rater_id", userId)
    .maybeSingle();
  return data ? (data.score as number) : null;
}

export async function getAggregate(
  pageId: string
): Promise<{ avg: number; count: number }> {
  const db = getAdminDb();
  const { data } = await db
    .from("ratings")
    .select("score")
    .eq("page_id", pageId);
  const arr = (data ?? []) as { score: number }[];
  const count = arr.length;
  const avg = count
    ? Math.round(arr.reduce((s, r) => s + r.score, 0) / count)
    : 0;
  return { avg, count };
}

export function canUserRate(user: SessionUser): boolean {
  return user.role === "super" || user.can_rate;
}
export function canUserViewScores(user: SessionUser): boolean {
  return user.role === "super" || user.can_view_scores;
}

export async function submitRating(
  user: SessionUser,
  pageId: string,
  score: number
): Promise<void> {
  if (!Number.isInteger(score) || score < 0 || score > 100 || score % 10 !== 0) {
    throw new AuthError("점수는 0~100, 10점 단위여야 합니다.", 400);
  }
  if (!(await getRatingsEnabled())) {
    throw new AuthError("점수 제도가 비활성화되어 있습니다.", 403);
  }
  if (!canUserRate(user)) {
    throw new AuthError("평가 권한이 없습니다.", 403);
  }

  const db = getAdminDb();
  const { data: page } = await db
    .from("pages")
    .select("created_by, is_deleted")
    .eq("id", pageId)
    .maybeSingle();
  if (!page || page.is_deleted) {
    throw new AuthError("문서를 찾을 수 없습니다.", 404);
  }
  if (page.created_by === user.id) {
    throw new AuthError("본인이 작성한 문서는 평가할 수 없습니다.", 403);
  }

  const { error } = await db
    .from("ratings")
    .insert({ page_id: pageId, rater_id: user.id, score });
  if (error) {
    // 23505 = unique 위반 (이미 평가함)
    if ((error as { code?: string }).code === "23505") {
      throw new AuthError("이미 평가했습니다. 점수는 수정할 수 없습니다.", 409);
    }
    throw new Error("평가 저장 실패: " + error.message);
  }
}

// 슈퍼 전용: 리셋 (pageId 있으면 해당 글만, 없으면 전체)
export async function resetRatings(pageId?: string): Promise<void> {
  const db = getAdminDb();
  if (pageId) {
    await db.from("ratings").delete().eq("page_id", pageId);
  } else {
    await db
      .from("ratings")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
  }
}
