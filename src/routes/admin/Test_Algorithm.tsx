import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export const Route = createFileRoute('/admin/Test_Algorithm')({
  component: RouteComponent,
})

type Attraction = {
  att_id: string
  name_th: string | null
  name_en: string | null
  detail_th: string | null
  detail_en: string | null

  travel_type: string[] | null
  category: string[] | null
  type: string | null
  region: string | null
  province: string | null

  latitude: number | null
  longitude: number | null

  avg_rating?: number | null
  visitor_count?: number | null

  topic_vector?: number[] | null
}

type Recommendation = {
  att_id: string
  name: string
  score: number

  predictedRating: number
  pDiv: number
  popularity: number
  pPop: number
  distanceKm: number
  pDis: number

  similarity?: number
  diversity?: number
  misclassificationCost?: number
}

type AlgorithmResult = {
  name: string
  runtime: number

  precision: number
  recall: number
  f1: number
  diversity: number
  averageDistance: number
  averagePopularity: number

  recommendations: Recommendation[]
}

function RouteComponent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [topK, setTopK] = useState(5)

  const [attractionCount, setAttractionCount] = useState(0)

  const [leeResult, setLeeResult] =
    useState<AlgorithmResult | null>(null)

  const [tdmcResult, setTdmcResult] =
    useState<AlgorithmResult | null>(null)

  const runAlgorithms = async () => {
    setLoading(true)
    setError(null)

    setLeeResult(null)
    setTdmcResult(null)

    try {
      // =====================================================
      // 1. โหลดข้อมูลสถานที่จริงจาก Supabase
      // =====================================================
// =====================================================
// 1. โหลด attraction ทั้งหมดจาก Supabase
//    แก้ปัญหา Supabase คืนมาแค่ 1,000 rows
// =====================================================

const pageSize = 1000
let from = 0

const allAttractions: Attraction[] = []

while (true) {
  const to = from + pageSize - 1

  const {
    data,
    error: attractionError,
  } = await supabase
    .from('attraction')
    .select(`
      att_id,
      name_th,
      name_en,
      detail_th,
      detail_en,
      travel_type,
      category,
      type,
      region,
      province,
      latitude,
      longitude,
      avg_rating,
      visitor_count,
      topic_vector
    `)
    .range(from, to)

  if (attractionError) {
    throw new Error(
      `ไม่สามารถโหลด attraction ได้: ${attractionError.message}`,
    )
  }

  if (!data || data.length === 0) {
    break
  }

  allAttractions.push(
    ...(data as Attraction[]),
  )

  console.log(
    `Loaded attractions: ${allAttractions.length}`,
  )

  // ถ้าหน้านี้มีไม่ถึง 1000 แปลว่าถึงหน้าสุดท้ายแล้ว
  if (data.length < pageSize) {
    break
  }

  from += pageSize
}

if (allAttractions.length === 0) {
  throw new Error(
    'ไม่พบข้อมูลใน public.attraction',
  )
}

const attractions = allAttractions

setAttractionCount(
  attractions.length,
)

console.log(
  'TOTAL ATTRACTIONS:',
  attractions.length,
)

      // =====================================================
      // 2. ตรวจสอบข้อมูลที่จำเป็น
      // =====================================================

      const hasCoordinates = attractions.some(
        (item) =>
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude)),
      )

      if (!hasCoordinates) {
        throw new Error(
          'public.attraction ยังไม่มี latitude / longitude ที่ใช้คำนวณระยะทาง',
        )
      }

      // =====================================================
      // 3. รัน Lee et al.
      // =====================================================

      const leeStart = performance.now()

      const leeRecommendations =
        runLeeAlgorithm(
          attractions,
          topK,
        )

      const leeRuntime =
        performance.now() - leeStart

      const leeMetrics =
        calculateMetrics(
          leeRecommendations,
          attractions,
        )

      setLeeResult({
        name: 'Lee et al. (2022)',
        runtime: leeRuntime,

        precision: leeMetrics.precision,
        recall: leeMetrics.recall,
        f1: leeMetrics.f1,
        diversity: leeMetrics.diversity,
        averageDistance:
          leeMetrics.averageDistance,
        averagePopularity:
          leeMetrics.averagePopularity,

        recommendations:
          leeRecommendations,
      })

      // =====================================================
      // 4. รัน Lin TDMC
      // =====================================================

      const tdmcStart = performance.now()

      const tdmcRecommendations =
        runTDMCAlgorithm(
          attractions,
          topK,
        )

      const tdmcRuntime =
        performance.now() - tdmcStart

      const tdmcMetrics =
        calculateMetrics(
          tdmcRecommendations,
          attractions,
        )

      setTdmcResult({
        name: 'Lin et al. TDMC',
        runtime: tdmcRuntime,

        precision: tdmcMetrics.precision,
        recall: tdmcMetrics.recall,
        f1: tdmcMetrics.f1,
        diversity: tdmcMetrics.diversity,
        averageDistance:
          tdmcMetrics.averageDistance,
        averagePopularity:
          tdmcMetrics.averagePopularity,

        recommendations:
          tdmcRecommendations,
      })
    } catch (err) {
      console.error(err)

      setError(
        err instanceof Error
          ? err.message
          : 'เกิดข้อผิดพลาดในการรัน Algorithm',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Algorithm Evaluation
          </h1>

          <p className="mt-2 text-slate-500">
            เปรียบเทียบ Lee et al. และ Lin et al. TDMC
            จากข้อมูลสถานที่จริงใน Supabase
          </p>
        </div>

        {/* ================================================= */}
        {/* CONTROL */}
        {/* ================================================= */}

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-end gap-5">

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                จำนวน Recommendation
              </label>

              <select
                value={topK}
                onChange={(event) =>
                  setTopK(Number(event.target.value))
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={15}>Top 15</option>
                <option value={20}>Top 20</option>
              </select>
            </div>

            <button
              type="button"
              onClick={runAlgorithms}
              disabled={loading}
              className="rounded-xl bg-blue-600 px-7 py-2.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading
                ? 'กำลังคำนวณ...'
                : '▶ Run Algorithms'}
            </button>

            {attractionCount > 0 && (
              <div className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm text-slate-600">
                Attractions: {attractionCount.toLocaleString()}
              </div>
            )}

          </div>
        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">

            <div className="font-bold text-red-800">
              ไม่สามารถรัน Algorithm ได้
            </div>

            <div className="mt-2 text-sm text-red-700">
              {error}
            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {loading && (
          <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

            <div className="mt-4 font-semibold text-blue-900">
              กำลังโหลดข้อมูลและคำนวณ Algorithm
            </div>

            <div className="mt-1 text-sm text-blue-600">
              กำลังใช้ข้อมูลจาก public.attraction จริง
            </div>

          </div>
        )}

        {/* ================================================= */}
        {/* RECOMMENDATIONS */}
        {/* ================================================= */}

        {(leeResult || tdmcResult) && (
          <div className="mb-8">

            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">
                Recommended Places
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                ชื่อสถานที่และคะแนนที่คำนวณจากข้อมูลจริง
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">

              {leeResult && (
                <RecommendationCard
                  result={leeResult}
                />
              )}

              {tdmcResult && (
                <RecommendationCard
                  result={tdmcResult}
                />
              )}

            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* METRICS */}
        {/* ================================================= */}

        {(leeResult || tdmcResult) && (
          <div>

            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Evaluation Metrics
            </h2>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead className="bg-slate-100">
                    <tr>

                      <th className="px-5 py-4 text-left">
                        Algorithm
                      </th>

                      <th className="px-5 py-4">
                        Precision
                      </th>

                      <th className="px-5 py-4">
                        Recall
                      </th>

                      <th className="px-5 py-4">
                        F1
                      </th>

                      <th className="px-5 py-4">
                        Diversity
                      </th>

                      <th className="px-5 py-4">
                        Avg Distance
                      </th>

                      <th className="px-5 py-4">
                        Avg Popularity
                      </th>

                      <th className="px-5 py-4">
                        Runtime
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {leeResult && (
                      <MetricRow result={leeResult} />
                    )}

                    {tdmcResult && (
                      <MetricRow result={tdmcResult} />
                    )}

                  </tbody>

                </table>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

/* =========================================================
   RECOMMENDATION CARD
========================================================= */

function RecommendationCard({
  result,
}: {
  result: AlgorithmResult
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-100 bg-slate-50 p-5">

        <h3 className="font-bold text-slate-900">
          {result.name}
        </h3>

        <p className="mt-1 text-xs text-slate-500">
          Top {result.recommendations.length}
        </p>

      </div>

      <div className="divide-y divide-slate-100">

        {result.recommendations.map(
          (place, index) => (
            <div
              key={place.att_id}
              className="p-5"
            >

              <div className="flex items-start gap-4">

                {/* Rank */}

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600">
                  {index + 1}
                </div>

                {/* Information */}

                <div className="min-w-0 flex-1">

                  <div className="font-semibold text-slate-900">
                    {place.name}
                  </div>

                  <div className="mt-1 text-xs text-slate-400">
                    ID: {place.att_id}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">

                    <MetricSmall
                      label="Predicted Rating"
                      value={place.predictedRating}
                    />

                    <MetricSmall
                      label="Distance"
                      value={`${place.distanceKm.toFixed(2)} km`}
                    />

                    <MetricSmall
                      label="Popularity"
                      value={place.popularity}
                    />

                    <MetricSmall
                      label="p-Div"
                      value={place.pDiv}
                    />

                    <MetricSmall
                      label="p-Pop"
                      value={place.pPop}
                    />

                    <MetricSmall
                      label="p-Dis"
                      value={place.pDis}
                    />

                  </div>

                </div>

                {/* Score */}

                <div className="shrink-0 text-right">

                  <div className="text-xs text-slate-400">
                    Score
                  </div>

                  <div className="text-2xl font-bold text-blue-600">
                    {place.score.toFixed(4)}
                  </div>

                </div>

              </div>

            </div>
          ),
        )}

      </div>
    </div>
  )
}

/* =========================================================
   METRIC ROW
========================================================= */

function MetricRow({
  result,
}: {
  result: AlgorithmResult
}) {
  return (
    <tr className="border-t border-slate-100">

      <td className="px-5 py-4 font-semibold">
        {result.name}
      </td>

      <td className="px-5 py-4 text-center">
        {result.precision.toFixed(4)}
      </td>

      <td className="px-5 py-4 text-center">
        {result.recall.toFixed(4)}
      </td>

      <td className="px-5 py-4 text-center font-semibold">
        {result.f1.toFixed(4)}
      </td>

      <td className="px-5 py-4 text-center">
        {result.diversity.toFixed(4)}
      </td>

      <td className="px-5 py-4 text-center">
        {result.averageDistance.toFixed(2)} km
      </td>

      <td className="px-5 py-4 text-center">
        {result.averagePopularity.toFixed(4)}
      </td>

      <td className="px-5 py-4 text-center">
        {result.runtime.toFixed(2)} ms
      </td>

    </tr>
  )
}

/* =========================================================
   SMALL METRIC
========================================================= */

function MetricSmall({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-1.5">

      <div className="text-[10px] text-slate-400">
        {label}
      </div>

      <div className="font-medium text-slate-700">
        {typeof value === 'number'
          ? value.toFixed(4)
          : value}
      </div>

    </div>
  )
}

/* =========================================================
   LEE ET AL.
========================================================= */

function runLeeAlgorithm(
  attractions: Attraction[],
  topK: number,
): Recommendation[] {

  const validPlaces =
    attractions.filter(
      (place) =>
        Number.isFinite(
          Number(place.latitude),
        ) &&
        Number.isFinite(
          Number(place.longitude),
        ),
    )

  if (!validPlaces.length) {
    return []
  }

  /*
   * ในหน้า Test นี้ยังไม่มี user history
   *
   * ดังนั้นค่าที่คำนวณได้จาก attraction
   * จะใช้ข้อมูลจริงของสถานที่เป็นฐาน
   *
   * เมื่อเชื่อม user history แล้ว
   * calculatePDiv / pPop / pDis
   * จะเปลี่ยนไปใช้ข้อมูล user จริง
   */

  const maxRating =
    Math.max(
      ...validPlaces.map(
        (p) =>
          Number(p.avg_rating) || 0,
      ),
      1,
    )

  const maxVisitors =
    Math.max(
      ...validPlaces.map(
        (p) =>
          Number(p.visitor_count) || 0,
      ),
      1,
    )

  const results =
    validPlaces.map(
      (place) => {

        const predictedRating =
          Number(place.avg_rating) ||
          0

        const ratingScore =
          predictedRating /
          maxRating

        const popularity =
          (Number(place.visitor_count) || 0) /
          maxVisitors

        /*
         * ค่า p-Div
         *
         * ถ้ามีหลาย travel_type
         * ให้ diversity สูงขึ้น
         */

        const typeCount =
          Array.isArray(
            place.travel_type,
          )
            ? place.travel_type.length
            : 0

        const pDiv =
          Math.min(
            typeCount / 3,
            1,
          ) || 0.1

        /*
         * p-Pop
         */

        const pPop =
          popularity

        /*
         * ไม่มี user location ในตอนนี้
         * จึงใช้ distance score = 1
         */

        const distanceKm = 0

        const distanceScore = 1

        const pDis = 1

        /*
         * Lee Final Score
         */

        const score =
          ratingScore *
          pDiv
          +
          popularity *
          pPop
          +
          distanceScore *
          pDis

        return {
          att_id: place.att_id,

          name:
            place.name_th ||
            place.name_en ||
            place.att_id,

          score,

          predictedRating,

          pDiv,

          popularity,

          pPop,

          distanceKm,

          pDis,
        }
      },
    )

  return results
    .sort(
      (a, b) =>
        b.score - a.score,
    )
    .slice(0, topK)
}

/* =========================================================
   LIN TDMC
========================================================= */

function runTDMCAlgorithm(
  attractions: Attraction[],
  topK: number,
): Recommendation[] {

  const validPlaces =
    attractions.filter(
      (place) =>
        Number.isFinite(
          Number(place.avg_rating),
        ),
    )

  /*
   * Stage 1
   *
   * เริ่มจาก predicted rating
   */

  const initial =
    validPlaces
      .map(
        (place) => ({
          place,

          predictedRating:
            Number(
              place.avg_rating,
            ) || 0,
        }),
      )
      .sort(
        (a, b) =>
          b.predictedRating -
          a.predictedRating,
      )

  const selected:
    Recommendation[] = []

  /*
   * Greedy Topic Diversity
   */

  while (
    selected.length < topK &&
    initial.length > 0
  ) {

    let bestIndex = 0

    let bestScore =
      -Infinity

    for (
      let i = 0;
      i < initial.length;
      i++
    ) {

      const candidate =
        initial[i]

      const candidateVector =
        candidate.place.topic_vector

      let averageSimilarity = 0

      let similarityCount = 0

      if (
        Array.isArray(
          candidateVector,
        )
      ) {

        for (
          const selectedPlace of selected
        ) {

          const selectedData =
            attractions.find(
              (p) =>
                p.att_id ===
                selectedPlace.att_id,
            )

          if (
            !selectedData ||
            !Array.isArray(
              selectedData.topic_vector,
            )
          ) {
            continue
          }

          const similarity =
            cosineSimilarity(
              candidateVector,
              selectedData.topic_vector,
            )

          averageSimilarity +=
            similarity

          similarityCount++
        }
      }

      if (similarityCount > 0) {
        averageSimilarity /=
          similarityCount
      }

      const diversity =
        1 -
        averageSimilarity

      const rating =
        candidate.predictedRating

      /*
       * TDMC utility
       *
       * rating สูง + diversity สูง
       */

      const utility =
        rating *
        (0.5 + 0.5 * diversity)

      if (
        utility >
        bestScore
      ) {
        bestScore =
          utility

        bestIndex = i
      }
    }

    const selectedCandidate =
      initial.splice(
        bestIndex,
        1,
      )[0]

    const place =
      selectedCandidate.place

    const similarity =
      selected.length > 0
        ? averageSelectedSimilarity(
            place,
            selected,
            attractions,
          )
        : 0

    const diversity =
      1 - similarity

    selected.push({
      att_id:
        place.att_id,

      name:
        place.name_th ||
        place.name_en ||
        place.att_id,

      score:
        selectedCandidate.predictedRating *
        (0.5 + 0.5 * diversity),

      predictedRating:
        selectedCandidate.predictedRating,

      pDiv:
        diversity,

      popularity:
        Number(
          place.visitor_count,
        ) || 0,

      pPop: 0,

      distanceKm: 0,

      pDis: 1,

      similarity,

      diversity,

      misclassificationCost:
        1 -
        selectedCandidate.predictedRating /
          5,
    })
  }

  return selected
}

/* =========================================================
   COSINE SIMILARITY
========================================================= */

function cosineSimilarity(
  a: number[],
  b: number[],
): number {

  if (
    !Array.isArray(a) ||
    !Array.isArray(b) ||
    a.length === 0 ||
    a.length !== b.length
  ) {
    return 0
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (
    let i = 0;
    i < a.length;
    i++
  ) {

    dot +=
      a[i] * b[i]

    normA +=
      a[i] * a[i]

    normB +=
      b[i] * b[i]
  }

  if (
    normA === 0 ||
    normB === 0
  ) {
    return 0
  }

  return (
    dot /
    (
      Math.sqrt(normA) *
      Math.sqrt(normB)
    )
  )
}

/* =========================================================
   AVERAGE SIMILARITY
========================================================= */

function averageSelectedSimilarity(
  place: Attraction,
  selected: Recommendation[],
  attractions: Attraction[],
): number {

  if (
    !Array.isArray(
      place.topic_vector,
    )
  ) {
    return 0
  }

  const similarities: number[] = []

  for (
    const selectedPlace of selected
  ) {

    const other =
      attractions.find(
        (p) =>
          p.att_id ===
          selectedPlace.att_id,
      )

    if (
      !other ||
      !Array.isArray(
        other.topic_vector,
      )
    ) {
      continue
    }

    similarities.push(
      cosineSimilarity(
        place.topic_vector,
        other.topic_vector,
      ),
    )
  }

  if (!similarities.length) {
    return 0
  }

  return (
    similarities.reduce(
      (sum, value) =>
        sum + value,
      0,
    ) /
    similarities.length
  )
}

/* =========================================================
   EVALUATION
========================================================= */

function calculateMetrics(
  recommendations: Recommendation[],
  attractions: Attraction[],
) {

  if (!recommendations.length) {
    return {
      precision: 0,
      recall: 0,
      f1: 0,
      diversity: 0,
      averageDistance: 0,
      averagePopularity: 0,
    }
  }

  /*
   * Relevant:
   *
   * rating >= 4
   */

  const relevant =
    new Set(
      attractions
        .filter(
          (place) =>
            Number(
              place.avg_rating,
            ) >= 4,
        )
        .map(
          (place) =>
            place.att_id,
        ),
    )

  const hits =
    recommendations.filter(
      (place) =>
        relevant.has(
          place.att_id,
        ),
    ).length

  const precision =
    hits /
    recommendations.length

  const recall =
    relevant.size > 0
      ? hits / relevant.size
      : 0

  const f1 =
    precision + recall > 0
      ? (
          2 *
          precision *
          recall
        ) /
        (
          precision +
          recall
        )
      : 0

  /*
   * Diversity
   */

  let similarityTotal = 0
  let similarityCount = 0

  for (
    let i = 0;
    i < recommendations.length;
    i++
  ) {

    const a =
      attractions.find(
        (p) =>
          p.att_id ===
          recommendations[i].att_id,
      )

    if (
      !a ||
      !Array.isArray(
        a.topic_vector,
      )
    ) {
      continue
    }

    for (
      let j = i + 1;
      j < recommendations.length;
      j++
    ) {

      const b =
        attractions.find(
          (p) =>
            p.att_id ===
            recommendations[j].att_id,
        )

      if (
        !b ||
        !Array.isArray(
          b.topic_vector,
        )
      ) {
        continue
      }

      similarityTotal +=
        cosineSimilarity(
          a.topic_vector,
          b.topic_vector,
        )

      similarityCount++
    }
  }

  const averageSimilarity =
    similarityCount > 0
      ? similarityTotal /
        similarityCount
      : 0

  const diversity =
    1 - averageSimilarity

  /*
   * Distance
   *
   * ตอนนี้ยังไม่มี user location
   */

  const averageDistance =
    recommendations.reduce(
      (sum, item) =>
        sum + item.distanceKm,
      0,
    ) /
    recommendations.length

  const averagePopularity =
    recommendations.reduce(
      (sum, item) =>
        sum + item.popularity,
      0,
    ) /
    recommendations.length

  return {
    precision,
    recall,
    f1,
    diversity,
    averageDistance,
    averagePopularity,
  }
}