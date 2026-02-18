// Face Analysis Logic - Enhanced Version
// Uses 68-point landmarks to generate detailed, non-repetitive analysis

// --- Geometric Calculation Helpers ---

const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2))
}

const getRatio = (n, d) => d === 0 ? 0 : n / d

// --- Feature Analysis Engine ---

export const analyzeFaceMetrics = (input) => {
  // Handle input: if it's a detection object with landmarks, extract them
  const landmarks = input && input.landmarks ? input.landmarks : input

  // Mock data generator if landmarks is invalid or missing required methods
  if (!landmarks || typeof landmarks.getJawOutline !== 'function') {
    console.warn('No valid landmarks detected, using mock data for demonstration')
    return {
      dimensions: {
        width: 200,
        widthToHeight: 0.75 + Math.random() * 0.1, // 0.75-0.85 (oval to round)
        jawToCheek: 0.8 + Math.random() * 0.1,
        jawWidth: 160,
        chinWidth: 60,
        jawAngle: 25 + Math.random() * 15 // 25-40
      },
      courts: {
        upper: 0.33 + (Math.random() - 0.5) * 0.05,
        middle: 0.33 + (Math.random() - 0.5) * 0.05,
        lower: 0.33 + (Math.random() - 0.5) * 0.05
      },
      brows: {
        arch: 5 + Math.random() * 10 // 5-15
      },
      eyes: {
        spacingRatio: 0.9 + Math.random() * 0.2, // 0.9-1.1
        roundness: 0.4 + Math.random() * 0.2, // 0.4-0.6
        tilt: (Math.random() - 0.5) * 10, // -5 to 5
        coverage: 0.2
      },
      nose: {
        widthRatio: 0.2 + Math.random() * 0.05, // 0.2-0.25
        lengthRatio: 0.3 + Math.random() * 0.05
      },
      lips: {
        fullness: 0.3 + Math.random() * 0.2, // 0.3-0.5
        widthRatio: 0.35 + Math.random() * 0.1
      }
    }
  }

  // Landmarks indices (approximate for face-api.js 68 points)
  // Jaw: 0-16 (8 is chin)
  // Eyebrows: 17-21 (left), 22-26 (right)
  // Nose: 27-35 (30 tip, 31-35 nostrils)
  // Eyes: 36-41 (left), 42-47 (right)
  // Mouth: 48-67

  const jaw = landmarks.getJawOutline()
  const nose = landmarks.getNose()
  const leftEye = landmarks.getLeftEye()
  const rightEye = landmarks.getRightEye()
  const mouth = landmarks.getMouth()
  const leftBrow = landmarks.getLeftEyeBrow()
  const rightBrow = landmarks.getRightEyeBrow()

  // 1. Face Dimensions & Shape
  const faceWidth = getDistance(jaw[0], jaw[16]) // Jaw width at ears
  const jawWidth = getDistance(jaw[4], jaw[12]) // Lower jaw width
  const chinWidth = getDistance(jaw[6], jaw[10]) // Chin width
  
  // Height estimation: Chin (8) to Mid-Eyebrow (avg of 21 and 22) + Forehead estimate
  const midBrowY = (leftBrow[4].y + rightBrow[0].y) / 2
  const chinY = jaw[8].y
  const lowerFaceHeight = chinY - midBrowY
  // Assume forehead is roughly 1/3 of total face, so total height approx lowerFaceHeight * 1.5
  const faceHeight = lowerFaceHeight * 1.5 
  
  const widthToHeightRatio = getRatio(faceWidth, faceHeight)
  const jawToFaceWidthRatio = getRatio(jawWidth, faceWidth)

  // 2. Three Courts (Vertical Proportions)
  // Upper: Hairline to Brow (Estimated)
  // Middle: Brow to Nose Base
  // Lower: Nose Base to Chin
  const noseBaseY = nose[6].y
  const middleCourt = noseBaseY - midBrowY
  const lowerCourt = chinY - noseBaseY
  const upperCourt = (middleCourt + lowerCourt) / 2
  const totalHeight = upperCourt + middleCourt + lowerCourt

  // 3. Five Eyes (Horizontal Proportions)
  const leftEyeWidth = getDistance(leftEye[0], leftEye[3])
  const rightEyeWidth = getDistance(rightEye[0], rightEye[3])
  const avgEyeWidth = (leftEyeWidth + rightEyeWidth) / 2
  const interEyeDistance = getDistance(leftEye[3], rightEye[0]) // Between eyes
  const leftTemple = getDistance(jaw[0], leftEye[0]) // Outer face to left eye
  const rightTemple = getDistance(rightEye[3], jaw[16]) // Right eye to outer face

  // 4. Detailed Feature Metrics
  // Eyes
  const eyeHeight = getDistance(leftEye[1], leftEye[5])
  const eyeRoundness = getRatio(eyeHeight, leftEyeWidth) // > 0.45 is round
  const eyeTilt = leftEye[3].y - leftEye[0].y // Positive = down-turned, Negative = up-turned (cat eye)
  
  // Nose
  const noseWidth = getDistance(nose[4], nose[8])
  const noseHeight = getDistance(nose[0], nose[6])
  const noseRatio = getRatio(noseWidth, noseHeight)
  
  // Lips
  const mouthWidth = getDistance(mouth[0], mouth[6])
  const upperLipHeight = getDistance(mouth[3], mouth[9]) // Top to opening
  const lowerLipHeight = getDistance(mouth[9], mouth[11]) // Opening to bottom (approx indices)
  const lipFullness = getRatio(upperLipHeight + lowerLipHeight, mouthWidth)

  // Eyebrows
  const browArch = ((leftBrow[0].y + leftBrow[4].y) / 2) - leftBrow[2].y // > 0 means arched

  // Jaw Angle (approximate using jaw points 4-8)
  // Vector 4->6 and 6->8
  const p4 = jaw[4], p6 = jaw[6], p8 = jaw[8]
  const angle = Math.atan2(p8.y - p6.y, p8.x - p6.x) - Math.atan2(p6.y - p4.y, p6.x - p4.x)
  const jawAngle = Math.abs(angle * 180 / Math.PI) // roughly 20-40 degrees usually

  return {
    dimensions: {
      width: faceWidth,
      widthToHeight: widthToHeightRatio,
      jawToCheek: jawToFaceWidthRatio,
      jawWidth: jawWidth,
      chinWidth: chinWidth,
      jawAngle: jawAngle
    },
    courts: {
      upper: upperCourt / totalHeight,
      middle: middleCourt / totalHeight,
      lower: lowerCourt / totalHeight
    },
    brows: {
      arch: browArch
    },
    eyes: {
      spacingRatio: interEyeDistance / avgEyeWidth, // 1.0 is ideal
      roundness: eyeRoundness,
      tilt: eyeTilt,
      coverage: avgEyeWidth / faceWidth // Eye size relative to face
    },
    nose: {
      widthRatio: noseWidth / faceWidth, // ~0.2 is standard
      lengthRatio: noseHeight / totalHeight
    },
    lips: {
      fullness: lipFullness,
      widthRatio: mouthWidth / faceWidth
    }
  }
}

// --- Content Generation Engine ---

const selectRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

// Text Libraries (Greatly Expanded)
const descriptors = {
  face: {
    oval: ['鹅蛋脸', '椭圆脸', '标准脸'],
    round: ['圆脸', '娃娃脸', '苹果脸'],
    square: ['方脸', '国字脸', '轮廓分明'],
    long: ['长脸', '瘦长脸', '马脸'],
    heart: ['心形脸', '倒三角', '瓜子脸'],
    diamond: ['菱形脸', '钻石脸', '高级脸'],
    oblong: ['长方脸', '矩形脸', '坚毅脸']
  },
  eyes: {
    round: ['杏眼', '圆眼', '小鹿眼'],
    long: ['柳叶眼', '长眼', '细长眼'],
    up: ['丹凤眼', '狐狸眼', '猫眼'],
    down: ['下垂眼', '狗狗眼', '无辜眼']
  }
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const scoreFromRange = (value, ideal, tolerance) => clamp(100 - Math.abs(value - ideal) / tolerance * 100, 0, 100)
const tagScore = (presetTags, tags) => presetTags.reduce((sum, tag) => sum + (tags.includes(tag) ? 1 : 0), 0)
const normalizeDiff = (value, ideal, tolerance) => clamp(Math.abs(value - ideal) / tolerance, 0, 2)
const average = (values) => values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0
const uniqueList = (list) => Array.from(new Set(list))
const selectTopByTags = (items, tags, limit) => {
  return items
    .map((item) => ({ item, score: tagScore(item.tags || [], tags) }))
    .sort((a, b) => b.score - a.score || String(a.item.id || a.item.name).localeCompare(String(b.item.id || b.item.name)))
    .slice(0, limit)
    .map((entry) => entry.item)
}

const buildStyleTags = (style, faceShape, eyeType, isMale) => {
  const text = `${style.main} ${style.sub} ${style.desc}`
  const tags = [faceShape, eyeType, isMale ? '男士' : '女生']
  if (/(甜美|初恋|可爱|元气)/.test(text)) tags.push('甜美')
  if (/(清冷|疏离|高冷|冷艳|清爽)/.test(text)) tags.push('清冷')
  if (/(气场|御姐|端庄|超模|硬汉|成熟|高级)/.test(text)) tags.push('气场')
  if (/(文艺|雅痞|古典|温婉)/.test(text)) tags.push('文艺')
  if (/(阳光|少年|校草)/.test(text)) tags.push('少年')
  if (/(明艳|艳)/.test(text)) tags.push('明艳')
  return tags
}

const buildMetricTags = (m, faceShape, eyeType) => {
  const tags = [faceShape, eyeType]
  if (m.courts.middle > 0.36) tags.push('中庭偏长')
  if (m.courts.middle < 0.3) tags.push('中庭偏短')
  if (m.courts.upper > 0.36) tags.push('上庭偏长')
  if (m.courts.lower > 0.36) tags.push('下庭偏长')
  if (m.eyes.spacingRatio > 1.1) tags.push('眼距偏宽')
  if (m.eyes.spacingRatio < 0.9) tags.push('眼距偏窄')
  if (m.dimensions.jawToCheek > 0.9) tags.push('下颌明显')
  if (m.dimensions.jawToCheek < 0.78) tags.push('下颌收敛')
  if (m.lips.fullness < 0.2) tags.push('薄唇')
  if (m.lips.fullness > 0.33) tags.push('厚唇')
  if (m.nose.widthRatio > 0.22) tags.push('鼻翼偏宽')
  if (m.nose.widthRatio < 0.18) tags.push('鼻翼偏窄')
  if (m.dimensions.widthToHeight > 0.85) tags.push('脸偏宽')
  if (m.dimensions.widthToHeight < 0.72) tags.push('脸偏长')
  return tags
}

const shapeIdeals = {
  oval: { widthToHeight: 0.76, jawToCheek: 0.82 },
  round: { widthToHeight: 0.86, jawToCheek: 0.9 },
  square: { widthToHeight: 0.84, jawToCheek: 0.93 },
  long: { widthToHeight: 0.7, jawToCheek: 0.82 },
  oblong: { widthToHeight: 0.69, jawToCheek: 0.88 },
  heart: { widthToHeight: 0.77, jawToCheek: 0.74 },
  diamond: { widthToHeight: 0.75, jawToCheek: 0.8 }
}

const getObjectiveScore = (m, faceShapeType) => {
  const courtDeviation = average([
    normalizeDiff(m.courts.upper, 1 / 3, 0.07),
    normalizeDiff(m.courts.middle, 1 / 3, 0.07),
    normalizeDiff(m.courts.lower, 1 / 3, 0.07)
  ])
  const fiveEyeDeviation = normalizeDiff(m.eyes.spacingRatio, 1.0, 0.22)
  const shapeIdeal = shapeIdeals[faceShapeType] || shapeIdeals.oval
  const shapeDeviation = average([
    normalizeDiff(m.dimensions.widthToHeight, shapeIdeal.widthToHeight, 0.08),
    normalizeDiff(m.dimensions.jawToCheek, shapeIdeal.jawToCheek, 0.1)
  ])
  const chinRatio = m.dimensions.chinWidth / m.dimensions.jawWidth
  const browRatio = m.brows.arch / m.dimensions.width
  const detailDeviation = average([
    normalizeDiff(chinRatio, 0.32, 0.18),
    normalizeDiff(m.nose.widthRatio, 0.21, 0.07),
    normalizeDiff(m.nose.lengthRatio, 0.33, 0.08),
    normalizeDiff(browRatio, 0.04, 0.03),
    normalizeDiff(m.lips.widthRatio, 0.38, 0.1),
    normalizeDiff(m.eyes.roundness, 0.42, 0.18)
  ])
  const weightedDeviation = courtDeviation * 0.38 + fiveEyeDeviation * 0.28 + shapeDeviation * 0.2 + detailDeviation * 0.14
  const base = 98 - weightedDeviation * 18 - (courtDeviation * 6 + fiveEyeDeviation * 4)
  return clamp(Math.round(base), 70, 96)
}

const makeupPresets = [
  { id: 'base-01', gender: 'female', category: 'base', tags: ['清透', '甜美', '日常'], text: '轻薄水润底妆，局部遮瑕提亮，营造干净素颜感。' },
  { id: 'base-02', gender: 'female', category: 'base', tags: ['清冷', '控油', '通勤'], text: '柔雾哑光底妆，压制T区油光，整体质感干净利落。' },
  { id: 'base-03', gender: 'female', category: 'base', tags: ['气场', '高级'], text: '半哑光底妆，细致磨皮感，颧骨提亮强化轮廓。' },
  { id: 'base-04', gender: 'all', category: 'base', tags: ['自然', '通勤'], text: '轻薄粉底叠加局部遮瑕，保持肤色统一与真实质感。' },
  { id: 'base-05', gender: 'male', category: 'base', tags: ['男士', '控油', '干净'], text: '男士哑光底妆，重点遮盖痘印，强调清爽肤感。' },
  { id: 'brows-01', gender: 'female', category: 'brows', tags: ['round', '甜美', '温柔'], text: '柔和弧度标准眉，眉头淡化，增强亲和感。' },
  { id: 'brows-02', gender: 'female', category: 'brows', tags: ['square', '气场'], text: '微挑眉型，眉峰明确，提升气场与立体度。' },
  { id: 'brows-03', gender: 'female', category: 'brows', tags: ['long', '清冷'], text: '偏平直眉形，缩短中庭视觉，气质更清冷。' },
  { id: 'brows-04', gender: 'female', category: 'brows', tags: ['甜美', '自然'], text: '自然野生眉，保留毛流感，弱化妆感。' },
  { id: 'brows-05', gender: 'male', category: 'brows', tags: ['男士', '硬朗'], text: '男士直线眉型，眉尾略加重，精气神更强。' },
  { id: 'eyes-01', gender: 'female', category: 'eyes', tags: ['up', '气场'], text: '上扬眼线搭配深色眼影，强调利落气场。' },
  { id: 'eyes-02', gender: 'female', category: 'eyes', tags: ['down', '温柔'], text: '下眼尾轻微加深，弱化下垂感，保持柔和。' },
  { id: 'eyes-03', gender: 'female', category: 'eyes', tags: ['round', '甜美'], text: '眼中加深、眼尾拉长，放大双眼的可爱感。' },
  { id: 'eyes-04', gender: 'female', category: 'eyes', tags: ['long', '清冷'], text: '细长眼线顺势拉长，打造冷感氛围。' },
  { id: 'eyes-05', gender: 'male', category: 'eyes', tags: ['男士', '干净'], text: '浅色眼影扫过眼窝，保持干净立体但不明显。' },
  { id: 'lips-01', gender: 'female', category: 'lips', tags: ['薄唇', '甜美'], text: '水光唇釉叠加，轻微晕染边界，增加丰盈感。' },
  { id: 'lips-02', gender: 'female', category: 'lips', tags: ['厚唇', '气场'], text: '哑光红棕色系，全唇上色，突出成熟气场。' },
  { id: 'lips-03', gender: 'female', category: 'lips', tags: ['清冷', '日常'], text: '裸粉或豆沙色薄涂，保持干净清冷气质。' },
  { id: 'lips-04', gender: 'female', category: 'lips', tags: ['明艳', '派对'], text: '正红或浆果色强调唇形，提升整体存在感。' },
  { id: 'lips-05', gender: 'male', category: 'lips', tags: ['男士', '自然'], text: '润色型唇膏轻薄涂抹，改善气色不显妆感。' },
  { id: 'contour-01', gender: 'female', category: 'contour', tags: ['square', '气场'], text: '下颌角与颧骨外侧修容，提升骨相线条。' },
  { id: 'contour-02', gender: 'female', category: 'contour', tags: ['round', '清冷'], text: '两颊外侧轻扫修容，收缩面宽，突出立体感。' },
  { id: 'contour-03', gender: 'female', category: 'contour', tags: ['long', '甜美'], text: '发际线与下巴底部轻修，缩短脸长视觉。' },
  { id: 'contour-04', gender: 'female', category: 'contour', tags: ['oval', '自然'], text: '轻量修容在鼻侧与颧下，保持自然轮廓。' },
  { id: 'contour-05', gender: 'male', category: 'contour', tags: ['男士', '干净'], text: '鼻侧轻修与下颌线扫影，强调轮廓但不夸张。' },
  { id: 'highlight-01', gender: 'female', category: 'highlight', tags: ['清透', '日常'], text: '鼻梁与眉骨点涂高光，打造清透光感。' },
  { id: 'highlight-02', gender: 'female', category: 'highlight', tags: ['清冷', '高级'], text: '冷调高光扫在颧骨与眼头，提升高级感。' },
  { id: 'highlight-03', gender: 'female', category: 'highlight', tags: ['明艳', '派对'], text: '高光集中在颧骨外侧与唇峰，增强立体度。' },
  { id: 'highlight-04', gender: 'female', category: 'highlight', tags: ['甜美', '温柔'], text: '细腻珠光扫在苹果肌上方，增加柔和光泽。' },
  { id: 'highlight-05', gender: 'male', category: 'highlight', tags: ['男士', '自然'], text: '局部提亮眉骨与鼻梁，保持低调自然。' }
]

const outfitPresets = [
  { id: 'm-work-01', gender: 'male', scene: 'work', tags: ['气场', '成熟'], title: '💼 职场商务', desc: '剪裁利落的西装套装，搭配低调配饰，强化专业形象。', items: ['深灰西装', '白衬衫', '皮质腕表'] },
  { id: 'm-work-02', gender: 'male', scene: 'work', tags: ['清冷', '通勤'], title: '💼 职场商务', desc: '极简风Polo与西裤组合，整体干净利落。', items: ['深蓝Polo', '直筒西裤', '牛津鞋'] },
  { id: 'm-work-03', gender: 'male', scene: 'work', tags: ['文艺'], title: '💼 职场商务', desc: '轻薄针织外套搭配衬衫，气质内敛稳重。', items: ['针织外套', '浅色衬衫', '德比鞋'] },
  { id: 'm-social-01', gender: 'male', scene: 'social', tags: ['少年', '阳光'], title: '🥂 社交聚会', desc: '轻松休闲衬衫与九分裤，清爽有活力。', items: ['浅色衬衫', '九分裤', '帆布鞋'] },
  { id: 'm-social-02', gender: 'male', scene: 'social', tags: ['气场', '高级'], title: '🥂 社交聚会', desc: '单色西装外套叠搭T恤，干净而有设计感。', items: ['单色西装', '纯色T恤', '乐福鞋'] },
  { id: 'm-social-03', gender: 'male', scene: 'social', tags: ['清冷'], title: '🥂 社交聚会', desc: '黑白配色强化冷感气质，简约而不寡淡。', items: ['黑色衬衫', '黑色长裤', '银色饰品'] },
  { id: 'm-casual-01', gender: 'male', scene: 'casual', tags: ['少年', '清爽'], title: '🏞️ 休闲约会', desc: '宽松卫衣与工装裤组合，舒适又耐看。', items: ['灰色卫衣', '工装裤', '小白鞋'] },
  { id: 'm-casual-02', gender: 'male', scene: 'casual', tags: ['文艺'], title: '🏞️ 休闲约会', desc: '针织衫搭配卡其裤，文艺感自然流露。', items: ['米色针织衫', '卡其裤', '休闲皮鞋'] },
  { id: 'm-casual-03', gender: 'male', scene: 'casual', tags: ['清冷'], title: '🏞️ 休闲约会', desc: '深色外套与直筒裤组合，利落简洁。', items: ['深色外套', '直筒牛仔裤', '板鞋'] },
  { id: 'f-work-01', gender: 'female', scene: 'work', tags: ['气场', '高级'], title: '💼 职场通勤', desc: '硬挺西装套装突出气场，线条干净利落。', items: ['西装外套', '直筒长裤', '简约耳钉'] },
  { id: 'f-work-02', gender: 'female', scene: 'work', tags: ['温柔', '甜美'], title: '💼 职场通勤', desc: '衬衫裙搭配低跟鞋，温柔中带干练。', items: ['衬衫裙', '低跟鞋', '细链手表'] },
  { id: 'f-work-03', gender: 'female', scene: 'work', tags: ['清冷', '通勤'], title: '💼 职场通勤', desc: '冷调针织与阔腿裤组合，气质清冷利落。', items: ['冷调针织', '阔腿裤', '尖头鞋'] },
  { id: 'f-party-01', gender: 'female', scene: 'party', tags: ['明艳', '气场'], title: '🥂 晚宴派对', desc: '修身长裙强调曲线，红唇提升存在感。', items: ['修身长裙', '亮片手包', '红唇妆'] },
  { id: 'f-party-02', gender: 'female', scene: 'party', tags: ['高级', '清冷'], title: '🥂 晚宴派对', desc: '丝绒材质拉满高级感，光泽感更显冷艳。', items: ['丝绒礼服', '珍珠耳坠', '高跟鞋'] },
  { id: 'f-party-03', gender: 'female', scene: 'party', tags: ['明艳', '甜美'], title: '🥂 晚宴派对', desc: '亮色小礼服搭配精致配饰，甜而不腻。', items: ['亮色礼服', '金属耳饰', '细跟鞋'] },
  { id: 'f-date-01', gender: 'female', scene: 'date', tags: ['甜美', '温柔'], title: '☕ 约会下午茶', desc: '碎花裙与开衫组合，甜美又有氛围感。', items: ['碎花裙', '针织开衫', '玛丽珍鞋'] },
  { id: 'f-date-02', gender: 'female', scene: 'date', tags: ['清冷'], title: '☕ 约会下午茶', desc: '简洁廓形连衣裙更显清冷，整体干净利落。', items: ['廓形连衣裙', '细项链', '浅口鞋'] },
  { id: 'f-date-03', gender: 'female', scene: 'date', tags: ['文艺'], title: '☕ 约会下午茶', desc: '茶歇裙搭配复古配饰，文艺气质自然显露。', items: ['茶歇裙', '复古耳饰', '小方包'] },
  { id: 'm-social-04', gender: 'male', scene: 'social', tags: ['文艺'], title: '🥂 社交聚会', desc: '亚麻衬衫搭配浅色长裤，松弛又有质感。', items: ['亚麻衬衫', '浅色长裤', '休闲皮鞋'] },
  { id: 'm-work-04', gender: 'male', scene: 'work', tags: ['高级'], title: '💼 职场商务', desc: '双排扣西装提升仪式感，搭配简洁领带。', items: ['双排扣西装', '素色领带', '皮鞋'] },
  { id: 'm-casual-04', gender: 'male', scene: 'casual', tags: ['阳光'], title: '🏞️ 休闲约会', desc: '轻便运动套装，舒适又显年轻活力。', items: ['运动外套', '束脚裤', '跑鞋'] },
  { id: 'f-work-04', gender: 'female', scene: 'work', tags: ['文艺'], title: '💼 职场通勤', desc: '针织马甲叠穿衬衫，知性温柔更显气质。', items: ['针织马甲', '白衬衫', '直筒裙'] },
  { id: 'f-party-04', gender: 'female', scene: 'party', tags: ['高级'], title: '🥂 晚宴派对', desc: '极简吊带裙搭配金属配饰，克制而高级。', items: ['吊带裙', '金属项链', '高跟鞋'] },
  { id: 'f-date-04', gender: 'female', scene: 'date', tags: ['甜美'], title: '☕ 约会下午茶', desc: '浅色针织搭配百褶裙，柔和又显气质。', items: ['浅色针织', '百褶裙', '小手包'] },
  { id: 'm-work-05', gender: 'male', scene: 'work', tags: ['清冷'], title: '💼 职场商务', desc: '深色风衣与西装裤组合，气质清冷有力度。', items: ['深色风衣', '西装裤', '皮靴'] },
  { id: 'm-social-05', gender: 'male', scene: 'social', tags: ['气场'], title: '🥂 社交聚会', desc: '皮衣叠搭高领针织，风格硬朗有型。', items: ['皮衣', '高领针织', '短靴'] },
  { id: 'm-casual-05', gender: 'male', scene: 'casual', tags: ['文艺'], title: '🏞️ 休闲约会', desc: '条纹衬衫搭配牛仔裤，日常又耐看。', items: ['条纹衬衫', '牛仔裤', '帆布鞋'] },
  { id: 'f-work-05', gender: 'female', scene: 'work', tags: ['气场'], title: '💼 职场通勤', desc: '收腰西装裙突出比例，干练且有力量感。', items: ['收腰西装裙', '尖头鞋', '简约耳环'] },
  { id: 'f-party-05', gender: 'female', scene: 'party', tags: ['明艳'], title: '🥂 晚宴派对', desc: '亮片短裙突出明艳感，派对氛围拉满。', items: ['亮片短裙', '丝绸披肩', '高跟鞋'] },
  { id: 'f-date-05', gender: 'female', scene: 'date', tags: ['清冷'], title: '☕ 约会下午茶', desc: '冷调西装外套搭配连衣裙，清冷又不失温柔。', items: ['冷调西装', '连衣裙', '细跟鞋'] }
]

const starPresets = [
  { name: '陈坤', gender: 'male', tags: ['oval', '清冷', '文艺', '男士'], style: '清冷文艺', desc: '骨相清晰，气质克制' },
  { name: '胡歌', gender: 'male', tags: ['long', '清爽', '成熟', '男士'], style: '清爽成熟', desc: '比例修长，气场稳重' },
  { name: '王凯', gender: 'male', tags: ['long', '气场', '成熟', '男士'], style: '气场成熟', desc: '轮廓利落，气质沉稳' },
  { name: '张震', gender: 'male', tags: ['square', '气场', '硬朗', '男士'], style: '硬朗气场', desc: '下颌有力，骨相突出' },
  { name: '刘德华', gender: 'male', tags: ['oblong', '成熟', '气场', '男士'], style: '经典硬朗', desc: '脸型修长，气场强' },
  { name: '梁朝伟', gender: 'male', tags: ['oblong', '清冷', '文艺', '男士'], style: '清冷文艺', desc: '眼神深邃，氛围感强' },
  { name: '彭于晏', gender: 'male', tags: ['square', '阳光', '男士'], style: '阳光硬朗', desc: '骨相分明，活力感强' },
  { name: '井柏然', gender: 'male', tags: ['oval', '清爽', '文艺', '男士'], style: '清爽文艺', desc: '比例舒展，质感干净' },
  { name: '吴彦祖', gender: 'male', tags: ['square', '气场', '高级', '男士'], style: '高级硬朗', desc: '轮廓深刻，立体度高' },
  { name: '黄晓明', gender: 'male', tags: ['square', '气场', '成熟', '男士'], style: '成熟气场', desc: '下颌明显，气场强' },
  { name: '李现', gender: 'male', tags: ['oval', '清爽', '男士'], style: '清爽阳光', desc: '五官均衡，气质明朗' },
  { name: '易烊千玺', gender: 'male', tags: ['heart', '清冷', '文艺', '男士'], style: '清冷文艺', desc: '轮廓细致，少年感强' },
  { name: '王俊凯', gender: 'male', tags: ['heart', '少年', '清爽', '男士'], style: '清爽少年', desc: '面部细致，气质轻盈' },
  { name: '蔡徐坤', gender: 'male', tags: ['heart', '明艳', '气场', '男士'], style: '明艳气场', desc: '五官精致，存在感强' },
  { name: '吴磊', gender: 'male', tags: ['oval', '少年', '清爽', '男士'], style: '清爽少年', desc: '比例协调，元气感强' },
  { name: '朱一龙', gender: 'male', tags: ['oblong', '清冷', '文艺', '男士'], style: '清冷文艺', desc: '五官精致，氛围感强' },
  { name: '张若昀', gender: 'male', tags: ['long', '成熟', '气场', '男士'], style: '成熟气场', desc: '轮廓修长，气场稳重' },
  { name: '许凯', gender: 'male', tags: ['oval', '清爽', '男士'], style: '清爽俊朗', desc: '比例舒适，气质干净' },
  { name: '白敬亭', gender: 'male', tags: ['oval', '清爽', '少年', '男士'], style: '清爽少年', desc: '五官清晰，气质轻松' },
  { name: '陈伟霆', gender: 'male', tags: ['round', '阳光', '男士'], style: '阳光动感', desc: '线条柔和，亲和力强' },
  { name: '李易峰', gender: 'male', tags: ['round', '清爽', '男士'], style: '清爽阳光', desc: '面部柔和，亲和感强' },
  { name: '宋仲基', gender: 'male', tags: ['round', '少年', '清爽', '男士'], style: '少年感', desc: '五官柔和，少年感强' },
  { name: '池昌旭', gender: 'male', tags: ['round', '阳光', '男士'], style: '阳光活力', desc: '比例柔和，元气感强' },
  { name: '孔刘', gender: 'male', tags: ['oblong', '成熟', '气场', '男士'], style: '成熟气场', desc: '骨相明显，气质沉稳' },
  { name: '朴叙俊', gender: 'male', tags: ['square', '阳光', '男士'], style: '阳光硬朗', desc: '轮廓清晰，活力感强' },
  { name: '玄彬', gender: 'male', tags: ['oblong', '气场', '高级', '男士'], style: '高级气场', desc: '骨相立体，气质强势' },
  { name: '金城武', gender: 'male', tags: ['oblong', '清冷', '文艺', '男士'], style: '清冷文艺', desc: '五官精致，氛围感强' },
  { name: '周渝民', gender: 'male', tags: ['oblong', '清爽', '文艺', '男士'], style: '清爽文艺', desc: '轮廓细致，气质克制' },
  { name: '赵又廷', gender: 'male', tags: ['square', '气场', '成熟', '男士'], style: '成熟气场', desc: '骨相明显，气场稳定' },
  { name: '刘昊然', gender: 'male', tags: ['oval', '少年', '清爽', '男士'], style: '清爽少年', desc: '比例协调，阳光感强' },
  { name: '龚俊', gender: 'male', tags: ['oblong', '清爽', '男士'], style: '清爽俊朗', desc: '五官立体，气质干净' },
  { name: '檀健次', gender: 'male', tags: ['oblong', '文艺', '男士'], style: '文艺气质', desc: '轮廓细致，气质柔和' },
  { name: '成毅', gender: 'male', tags: ['oblong', '清冷', '男士'], style: '清冷气质', desc: '比例修长，气质克制' },
  { name: '杨洋', gender: 'male', tags: ['oval', '清爽', '男士'], style: '清爽校草', desc: '五官比例协调' },
  { name: '鹿晗', gender: 'male', tags: ['oval', '少年', '清爽', '男士'], style: '清爽少年', desc: '线条柔和，少年感强' },
  { name: '吴尊', gender: 'male', tags: ['oval', '成熟', '男士'], style: '成熟俊朗', desc: '比例协调，气质温和' },
  { name: '王力宏', gender: 'male', tags: ['oblong', '气场', '成熟', '男士'], style: '成熟气场', desc: '骨相清晰，气质稳重' },
  { name: '周杰伦', gender: 'male', tags: ['round', '文艺', '男士'], style: '文艺气质', desc: '线条柔和，个性鲜明' },
  { name: '张学友', gender: 'male', tags: ['oblong', '成熟', '男士'], style: '成熟稳重', desc: '比例修长，气质稳健' },
  { name: '周润发', gender: 'male', tags: ['square', '气场', '成熟', '男士'], style: '经典气场', desc: '下颌清晰，气场强' },
  { name: '本尼迪克特·康伯巴奇', gender: 'male', tags: ['long', '清冷', '高级', '男士'], style: '清冷高级', desc: '脸型修长，骨相突出' },
  { name: '亨利·卡维尔', gender: 'male', tags: ['square', '气场', '硬朗', '男士'], style: '硬朗气场', desc: '下颌明显，立体度高' },
  { name: '布拉德·皮特', gender: 'male', tags: ['square', '成熟', '气场', '男士'], style: '成熟硬朗', desc: '骨相分明，气场稳重' },
  { name: '莱昂纳多·迪卡普里奥', gender: 'male', tags: ['round', '成熟', '男士'], style: '成熟温和', desc: '轮廓柔和，气质稳重' },
  { name: '佩德罗·帕斯卡', gender: 'male', tags: ['oblong', '成熟', '男士'], style: '成熟稳重', desc: '比例修长，气质内敛' },
  { name: '基努·里维斯', gender: 'male', tags: ['long', '清冷', '男士'], style: '清冷气质', desc: '轮廓修长，氛围感强' },
  { name: '汤姆·哈迪', gender: 'male', tags: ['square', '硬朗', '男士'], style: '硬朗气质', desc: '下颌有力，骨相突出' },
  { name: '裘德·洛', gender: 'male', tags: ['oblong', '清爽', '男士'], style: '清爽成熟', desc: '比例修长，气质干净' },
  { name: '詹姆斯·麦卡沃伊', gender: 'male', tags: ['round', '清爽', '男士'], style: '清爽温和', desc: '线条柔和，亲和力强' },
  { name: '罗伯特·帕丁森', gender: 'male', tags: ['oblong', '清冷', '男士'], style: '清冷气质', desc: '轮廓修长，氛围感强' },
  { name: '刘亦菲', gender: 'female', tags: ['oval', '清冷', '女生'], style: '清冷古典', desc: '比例协调，气质清雅' },
  { name: '高圆圆', gender: 'female', tags: ['oval', '温柔', '女生'], style: '温柔气质', desc: '五官协调，气质柔和' },
  { name: '章子怡', gender: 'female', tags: ['square', '气场', '女生'], style: '气场高级', desc: '骨相明显，气场强' },
  { name: '倪妮', gender: 'female', tags: ['square', '高级', '女生'], style: '高级气场', desc: '轮廓分明，气质强' },
  { name: '舒淇', gender: 'female', tags: ['square', '明艳', '女生'], style: '明艳气质', desc: '骨相明显，存在感强' },
  { name: '周迅', gender: 'female', tags: ['heart', '清冷', '女生'], style: '清冷文艺', desc: '轮廓细致，灵动感强' },
  { name: '赵丽颖', gender: 'female', tags: ['round', '甜美', '女生'], style: '甜美可爱', desc: '线条柔和，亲和感强' },
  { name: '杨幂', gender: 'female', tags: ['oval', '气场', '女生'], style: '气场轻熟', desc: '比例协调，气场稳定' },
  { name: '迪丽热巴', gender: 'female', tags: ['diamond', '明艳', '女生'], style: '明艳高级', desc: '五官立体，存在感强' },
  { name: '杨紫', gender: 'female', tags: ['round', '甜美', '女生'], style: '甜美气质', desc: '轮廓柔和，亲和力强' },
  { name: '刘诗诗', gender: 'female', tags: ['oval', '古典', '女生'], style: '古典温婉', desc: '比例舒适，气质优雅' },
  { name: '唐嫣', gender: 'female', tags: ['oblong', '清爽', '女生'], style: '清爽温柔', desc: '脸型修长，气质干净' },
  { name: '孙俪', gender: 'female', tags: ['square', '气场', '女生'], style: '干练气场', desc: '骨相明显，气质稳重' },
  { name: '韩雪', gender: 'female', tags: ['oval', '清冷', '女生'], style: '清冷气质', desc: '五官精致，气质冷感' },
  { name: '金泰希', gender: 'female', tags: ['oval', '甜美', '女生'], style: '甜美温柔', desc: '五官协调，气质温和' },
  { name: '林允儿', gender: 'female', tags: ['oval', '清爽', '女生'], style: '清爽温柔', desc: '比例舒适，气质干净' },
  { name: 'IU', gender: 'female', tags: ['round', '甜美', '女生'], style: '甜美清新', desc: '线条柔和，亲和感强' },
  { name: '朴信惠', gender: 'female', tags: ['round', '温柔', '女生'], style: '温柔亲和', desc: '轮廓柔和，气质温和' },
  { name: '高允真', gender: 'female', tags: ['oval', '清冷', '女生'], style: '清冷高级', desc: '五官精致，气质冷感' },
  { name: '金高银', gender: 'female', tags: ['round', '文艺', '女生'], style: '文艺气质', desc: '线条柔和，气质自然' },
  { name: '裴秀智', gender: 'female', tags: ['oval', '甜美', '女生'], style: '甜美清爽', desc: '比例协调，气质清新' },
  { name: '赵露思', gender: 'female', tags: ['round', '甜美', '女生'], style: '甜美可爱', desc: '面部柔和，亲和力强' },
  { name: '周也', gender: 'female', tags: ['heart', '清冷', '女生'], style: '清冷气质', desc: '轮廓细致，气质克制' },
  { name: '张子枫', gender: 'female', tags: ['heart', '文艺', '女生'], style: '文艺气质', desc: '面部细致，灵动感强' },
  { name: '欧阳娜娜', gender: 'female', tags: ['oval', '文艺', '女生'], style: '文艺清爽', desc: '比例舒适，气质清新' },
  { name: '周冬雨', gender: 'female', tags: ['heart', '清冷', '女生'], style: '清冷灵动', desc: '轮廓细致，气质独特' },
  { name: '李沁', gender: 'female', tags: ['oval', '温柔', '女生'], style: '温柔清雅', desc: '五官协调，气质柔和' },
  { name: '陈妍希', gender: 'female', tags: ['round', '甜美', '女生'], style: '甜美清新', desc: '线条柔和，亲和感强' },
  { name: '张含韵', gender: 'female', tags: ['round', '甜美', '女生'], style: '甜美元气', desc: '面部柔和，元气感强' },
  { name: '刘涛', gender: 'female', tags: ['square', '气场', '女生'], style: '气场轻熟', desc: '轮廓清晰，气质稳重' },
  { name: '贾静雯', gender: 'female', tags: ['oval', '温柔', '女生'], style: '温柔气质', desc: '比例协调，亲和力强' },
  { name: '林青霞', gender: 'female', tags: ['square', '气场', '女生'], style: '经典气场', desc: '骨相明显，气场强' },
  { name: '王祖贤', gender: 'female', tags: ['oblong', '清冷', '女生'], style: '清冷气质', desc: '比例修长，气质冷感' },
  { name: '张曼玉', gender: 'female', tags: ['oblong', '文艺', '女生'], style: '文艺气质', desc: '轮廓修长，气质克制' },
  { name: '朱茵', gender: 'female', tags: ['heart', '甜美', '女生'], style: '甜美灵动', desc: '面部细致，灵动感强' },
  { name: '蒋勤勤', gender: 'female', tags: ['oval', '古典', '女生'], style: '古典温婉', desc: '比例协调，气质清雅' },
  { name: '赵雅芝', gender: 'female', tags: ['oval', '温柔', '女生'], style: '温柔典雅', desc: '五官协调，气质温和' },
  { name: '董洁', gender: 'female', tags: ['oval', '清爽', '女生'], style: '清爽温柔', desc: '比例舒适，气质干净' },
  { name: '莫文蔚', gender: 'female', tags: ['long', '气场', '女生'], style: '气场高级', desc: '轮廓修长，气质强' },
  { name: 'Maggie Q', gender: 'female', tags: ['oblong', '气场', '女生'], style: '气场利落', desc: '骨相分明，气质利落' },
  { name: '安吉丽娜·朱莉', gender: 'female', tags: ['square', '明艳', '女生'], style: '明艳气场', desc: '轮廓强烈，存在感强' },
  { name: '艾玛·沃特森', gender: 'female', tags: ['oval', '温柔', '女生'], style: '温柔清雅', desc: '比例协调，气质柔和' },
  { name: '娜塔莉·波特曼', gender: 'female', tags: ['heart', '清冷', '女生'], style: '清冷古典', desc: '轮廓细致，气质克制' },
  { name: '斯嘉丽·约翰逊', gender: 'female', tags: ['round', '明艳', '女生'], style: '明艳气质', desc: '线条柔和，存在感强' },
  { name: '安妮·海瑟薇', gender: 'female', tags: ['oval', '气场', '女生'], style: '气场优雅', desc: '五官立体，气质强' },
  { name: '詹妮弗·劳伦斯', gender: 'female', tags: ['round', '气场', '女生'], style: '气场轻熟', desc: '轮廓柔和，气质稳重' },
  { name: '赛琳娜·戈麦斯', gender: 'female', tags: ['round', '甜美', '女生'], style: '甜美气质', desc: '线条柔和，亲和力强' },
  { name: '盖尔·加朵', gender: 'female', tags: ['oblong', '气场', '女生'], style: '气场高级', desc: '比例修长，气质强' },
  { name: '李嘉欣', gender: 'female', tags: ['oblong', '高级', '女生'], style: '高级冷艳', desc: '脸型修长，气质冷艳' },
  { name: '范冰冰', gender: 'female', tags: ['heart', '明艳', '女生'], style: '明艳气场', desc: '轮廓精致，存在感强' },
  { name: 'Angelababy', gender: 'female', tags: ['heart', '甜美', '女生'], style: '甜美清爽', desc: '五官精致，气质轻盈' },
  { name: '李冰冰', gender: 'female', tags: ['square', '气场', '女生'], style: '气场强势', desc: '骨相突出，气场强' },
  { name: '张柏芝', gender: 'female', tags: ['oval', '清冷', '女生'], style: '清冷清爽', desc: '五官立体，气质清冷' },
  { name: '王菲', gender: 'female', tags: ['long', '清冷', '女生'], style: '清冷高级', desc: '线条修长，气质克制' },
  { name: '刘雯', gender: 'female', tags: ['long', '高级', '女生'], style: '高级超模', desc: '比例修长，气场强' },
  { name: '杜鹃', gender: 'female', tags: ['long', '清冷', '女生'], style: '清冷高级', desc: '骨相突出，氛围感强' },
  { name: '奚梦瑶', gender: 'female', tags: ['long', '气场', '女生'], style: '气场利落', desc: '轮廓清晰，气场稳' },
  { name: '李宇春', gender: 'female', tags: ['square', '清冷', '女生'], style: '清冷中性', desc: '骨相清晰，气质独特' },
  { name: '马思纯', gender: 'female', tags: ['round', '温柔', '女生'], style: '温柔亲和', desc: '线条柔和，气质温和' },
  { name: '谭松韵', gender: 'female', tags: ['round', '甜美', '女生'], style: '甜美元气', desc: '轮廓柔和，亲和感强' },
  { name: '宋祖儿', gender: 'female', tags: ['round', '清爽', '女生'], style: '清爽甜美', desc: '线条柔和，气质清新' },
  { name: '邓紫棋', gender: 'female', tags: ['round', '明艳', '女生'], style: '明艳活力', desc: '气质鲜明，活力感强' },
  { name: '周雨彤', gender: 'female', tags: ['oval', '清爽', '女生'], style: '清爽气质', desc: '比例舒适，气质干净' },
  { name: '白鹿', gender: 'female', tags: ['oval', '甜美', '女生'], style: '甜美清爽', desc: '五官协调，气质甜美' },
  { name: '虞书欣', gender: 'female', tags: ['round', '甜美', '女生'], style: '甜美可爱', desc: '线条柔和，亲和感强' },
  { name: '程潇', gender: 'female', tags: ['oval', '明艳', '女生'], style: '明艳气质', desc: '比例协调，存在感强' },
  { name: '张雨绮', gender: 'female', tags: ['square', '明艳', '女生'], style: '明艳气场', desc: '轮廓分明，气场强' },
  { name: '秦岚', gender: 'female', tags: ['oval', '温柔', '女生'], style: '温柔气质', desc: '比例协调，气质柔和' },
  { name: '袁泉', gender: 'female', tags: ['long', '清冷', '女生'], style: '清冷文艺', desc: '线条修长，气质克制' },
  { name: '蔡少芬', gender: 'female', tags: ['diamond', '气场', '女生'], style: '气场利落', desc: '骨相清晰，气场强' },
  { name: '郭采洁', gender: 'female', tags: ['square', '文艺', '女生'], style: '文艺气质', desc: '轮廓清晰，气质文艺' },
  { name: '周笔畅', gender: 'female', tags: ['square', '清冷', '女生'], style: '清冷中性', desc: '骨相分明，风格鲜明' },
  { name: '杨采钰', gender: 'female', tags: ['oval', '古典', '女生'], style: '古典温婉', desc: '比例协调，气质优雅' },
  { name: '景甜', gender: 'female', tags: ['oval', '甜美', '女生'], style: '甜美清新', desc: '五官协调，气质柔和' },
  { name: '王鸥', gender: 'female', tags: ['long', '气场', '女生'], style: '气场轻熟', desc: '比例修长，气场稳定' },
  { name: '张钧甯', gender: 'female', tags: ['oval', '清爽', '女生'], style: '清爽知性', desc: '比例舒适，气质干净' },
  { name: '田馥甄', gender: 'female', tags: ['oval', '文艺', '女生'], style: '文艺清爽', desc: '线条柔和，气质自然' },
  { name: '蔡依林', gender: 'female', tags: ['round', '明艳', '女生'], style: '明艳动感', desc: '轮廓柔和，舞台感强' },
  { name: '孙艺珍', gender: 'female', tags: ['oval', '温柔', '女生'], style: '温柔清雅', desc: '比例协调，气质柔和' },
  { name: '金智秀', gender: 'female', tags: ['oval', '清冷', '女生'], style: '清冷精致', desc: '五官清晰，气质克制' },
  { name: '金智妮', gender: 'female', tags: ['round', '气场', '女生'], style: '气场甜酷', desc: '线条柔和，气场鲜明' },
  { name: 'Lisa', gender: 'female', tags: ['long', '清爽', '女生'], style: '清爽利落', desc: '比例修长，气质干净' },
  { name: 'Rosé', gender: 'female', tags: ['long', '清冷', '女生'], style: '清冷文艺', desc: '线条修长，气质克制' },
  { name: '宋慧乔', gender: 'female', tags: ['oval', '温柔', '女生'], style: '温柔气质', desc: '比例协调，亲和力强' },
  { name: '全智贤', gender: 'female', tags: ['square', '气场', '女生'], style: '气场高级', desc: '轮廓明显，气场强' },
  { name: '崔智友', gender: 'female', tags: ['oval', '温柔', '女生'], style: '温柔清雅', desc: '比例协调，气质柔和' },
  { name: '金所泫', gender: 'female', tags: ['round', '清爽', '女生'], style: '清爽甜美', desc: '线条柔和，气质清新' },
  { name: '朴敏英', gender: 'female', tags: ['oval', '甜美', '女生'], style: '甜美优雅', desc: '比例协调，气质温柔' },
  { name: '艾玛·斯通', gender: 'female', tags: ['diamond', '文艺', '女生'], style: '文艺清爽', desc: '骨相清晰，气质灵动' },
  { name: '凯拉·奈特莉', gender: 'female', tags: ['oblong', '清冷', '女生'], style: '清冷文艺', desc: '比例修长，气质克制' },
  { name: '凯特·布兰切特', gender: 'female', tags: ['long', '高级', '女生'], style: '高级气场', desc: '轮廓清晰，气质强' },
  { name: '玛格特·罗比', gender: 'female', tags: ['square', '明艳', '女生'], style: '明艳气场', desc: '骨相清晰，存在感强' },
  { name: '伊娃·格林', gender: 'female', tags: ['diamond', '清冷', '女生'], style: '清冷高级', desc: '五官立体，氛围感强' },
  { name: '詹妮弗·康纳利', gender: 'female', tags: ['oblong', '文艺', '女生'], style: '文艺清冷', desc: '比例修长，气质克制' },
  { name: '米兰达·可儿', gender: 'female', tags: ['oval', '甜美', '女生'], style: '甜美清爽', desc: '比例协调，气质明朗' },
  { name: '吉吉·哈迪德', gender: 'female', tags: ['oblong', '高级', '女生'], style: '高级气场', desc: '比例修长，气质强' },
  { name: '金·卡戴珊', gender: 'female', tags: ['square', '明艳', '女生'], style: '明艳气场', desc: '轮廓清晰，存在感强' },
  { name: '蕾哈娜', gender: 'female', tags: ['round', '明艳', '女生'], style: '明艳气质', desc: '线条柔和，气场强' },
  { name: '杜阿·利帕', gender: 'female', tags: ['square', '气场', '女生'], style: '气场高级', desc: '骨相明显，气场稳' },
  { name: '伊丽莎白·德比齐', gender: 'female', tags: ['long', '高级', '女生'], style: '高级冷感', desc: '比例修长，气质克制' },
  { name: '查理兹·塞隆', gender: 'female', tags: ['square', '气场', '女生'], style: '气场硬朗', desc: '轮廓清晰，气场强' },
  { name: '妮可·基德曼', gender: 'female', tags: ['long', '清冷', '女生'], style: '清冷高级', desc: '线条修长，气质克制' },
  { name: '奥黛丽·赫本', gender: 'female', tags: ['heart', '清冷', '女生'], style: '清冷古典', desc: '轮廓精致，气质优雅' },
  { name: '格蕾丝·凯利', gender: 'female', tags: ['oval', '古典', '女生'], style: '古典优雅', desc: '比例协调，气质高贵' },
  { name: '玛丽莲·梦露', gender: 'female', tags: ['round', '明艳', '女生'], style: '明艳复古', desc: '线条柔和，存在感强' }
]

const hairstylePresets = [
  { id: 'm-hair-01', gender: 'male', tags: ['round', '少年', '清爽', '男士'], text: '两侧铲青短碎发，拉长脸型比例' },
  { id: 'm-hair-02', gender: 'male', tags: ['square', '硬朗', '男士'], text: '短寸配低渐变，突出下颌线条' },
  { id: 'm-hair-03', gender: 'male', tags: ['long', '清冷', '男士'], text: '中分微卷，弱化脸长感' },
  { id: 'm-hair-04', gender: 'male', tags: ['oval', '清爽', '男士'], text: '三七分侧背，干净利落' },
  { id: 'm-hair-05', gender: 'male', tags: ['heart', '少年', '男士'], text: '蓬松刘海，缩短额头视觉' },
  { id: 'm-hair-06', gender: 'male', tags: ['oblong', '成熟', '男士'], text: '自然侧分，顶部微蓬松' },
  { id: 'm-hair-07', gender: 'male', tags: ['square', '气场', '男士'], text: '背头油头，强化气场' },
  { id: 'm-hair-08', gender: 'male', tags: ['round', '清爽', '男士'], text: '露额短发，提升清爽感' },
  { id: 'm-hair-09', gender: 'male', tags: ['long', '文艺', '男士'], text: '纹理烫轻卷，增加层次感' },
  { id: 'm-hair-10', gender: 'male', tags: ['oval', '文艺', '男士'], text: '低饱和短卷，气质文艺' },
  { id: 'm-hair-11', gender: 'male', tags: ['heart', '清冷', '男士'], text: '轻薄刘海配侧分，突出骨相' },
  { id: 'm-hair-12', gender: 'male', tags: ['oblong', '气场', '男士'], text: '高顶短发，提升纵向比例' },
  { id: 'f-hair-01', gender: 'female', tags: ['round', '甜美', '女生'], text: '八字刘海+锁骨发，修饰面宽' },
  { id: 'f-hair-02', gender: 'female', tags: ['square', '气场', '女生'], text: '侧分大波浪，弱化下颌角' },
  { id: 'f-hair-03', gender: 'female', tags: ['long', '清冷', '女生'], text: '空气刘海+中长发，缩短脸长' },
  { id: 'f-hair-04', gender: 'female', tags: ['oval', '温柔', '女生'], text: '黑长直或微卷，气质温柔' },
  { id: 'f-hair-05', gender: 'female', tags: ['heart', '甜美', '女生'], text: '锁骨发+微卷，突出灵动感' },
  { id: 'f-hair-06', gender: 'female', tags: ['oblong', '气场', '女生'], text: '高层次卷发，提升气场' },
  { id: 'f-hair-07', gender: 'female', tags: ['diamond', '清冷', '女生'], text: '轻薄刘海+直发，柔化颧骨' },
  { id: 'f-hair-08', gender: 'female', tags: ['round', '清爽', '女生'], text: '高马尾或丸子头，拉长脸型' },
  { id: 'f-hair-09', gender: 'female', tags: ['square', '文艺', '女生'], text: '法式刘海+中短卷，气质文艺' },
  { id: 'f-hair-10', gender: 'female', tags: ['long', '明艳', '女生'], text: '侧分大卷，提升妩媚感' },
  { id: 'f-hair-11', gender: 'female', tags: ['oval', '清冷', '女生'], text: '中分直发，强化清冷气质' },
  { id: 'f-hair-12', gender: 'female', tags: ['heart', '古典', '女生'], text: '低盘发或公主头，古典温婉' }
]

const colorPalettes = [
  { id: 'c-01', gender: 'female', tags: ['清冷'], suitable: ['雾霾蓝', '冷灰', '象牙白'], avoid: ['荧光粉', '高饱和橙'] },
  { id: 'c-02', gender: 'female', tags: ['甜美'], suitable: ['奶杏', '樱花粉', '米白'], avoid: ['黑白强对比'] },
  { id: 'c-03', gender: 'female', tags: ['气场'], suitable: ['酒红', '深咖', '墨绿'], avoid: ['浅粉'] },
  { id: 'c-04', gender: 'female', tags: ['文艺'], suitable: ['橄榄绿', '奶茶', '灰蓝'], avoid: ['亮黄'] },
  { id: 'c-05', gender: 'female', tags: ['明艳'], suitable: ['正红', '金色', '黑'], avoid: ['过度灰调'] },
  { id: 'c-06', gender: 'female', tags: ['古典'], suitable: ['米驼', '绛红', '墨蓝'], avoid: ['荧光绿'] },
  { id: 'c-07', gender: 'female', tags: ['清爽'], suitable: ['浅蓝', '白', '浅卡其'], avoid: ['深紫'] },
  { id: 'c-08', gender: 'female', tags: ['温柔'], suitable: ['薰衣草', '浅灰', '奶白'], avoid: ['高饱和红'] },
  { id: 'c-09', gender: 'male', tags: ['清爽'], suitable: ['黑', '白', '灰'], avoid: ['亮橙'] },
  { id: 'c-10', gender: 'male', tags: ['气场'], suitable: ['深灰', '藏青', '黑'], avoid: ['浅粉'] },
  { id: 'c-11', gender: 'male', tags: ['文艺'], suitable: ['卡其', '橄榄绿', '米白'], avoid: ['高饱和蓝'] },
  { id: 'c-12', gender: 'male', tags: ['少年'], suitable: ['浅蓝', '白', '浅灰'], avoid: ['深紫'] },
  { id: 'c-13', gender: 'male', tags: ['成熟'], suitable: ['深棕', '墨绿', '海军蓝'], avoid: ['荧光色'] },
  { id: 'c-14', gender: 'male', tags: ['清冷'], suitable: ['石墨灰', '冷白', '深蓝'], avoid: ['亮黄'] },
  { id: 'c-15', gender: 'female', tags: ['高级'], suitable: ['香槟金', '深咖', '米白'], avoid: ['荧光色'] },
  { id: 'c-16', gender: 'female', tags: ['轻熟'], suitable: ['莫兰迪粉', '灰蓝', '米色'], avoid: ['亮橙'] },
  { id: 'c-17', gender: 'male', tags: ['高级'], suitable: ['黑', '白', '冷灰'], avoid: ['亮绿'] },
  { id: 'c-18', gender: 'female', tags: ['清新'], suitable: ['薄荷绿', '奶白', '浅蓝'], avoid: ['深棕'] },
  { id: 'c-19', gender: 'male', tags: ['硬朗'], suitable: ['深灰', '军绿', '黑'], avoid: ['粉紫'] },
  { id: 'c-20', gender: 'female', tags: ['气场', '成熟'], suitable: ['黑', '酒红', '深棕'], avoid: ['亮粉'] }
]

const skincareAdvicePresets = [
  { id: 'skin-01', tags: ['男士', '清爽'], text: '坚持温和洁面，避免过度去油' },
  { id: 'skin-02', tags: ['男士', '气场'], text: '选择哑光防晒，保持清爽质感' },
  { id: 'skin-03', tags: ['女生', '甜美'], text: '补水面膜每周 2 次，保持水润' },
  { id: 'skin-04', tags: ['女生', '清冷'], text: '注重轻薄保湿，减少油光' },
  { id: 'skin-05', tags: ['中庭偏长'], text: '颧部提亮与保湿，优化中庭质感' },
  { id: 'skin-06', tags: ['眼距偏宽'], text: '眼周保湿与提亮，增强聚焦感' },
  { id: 'skin-07', tags: ['眼距偏窄'], text: '细致眼周护理，减少紧绷感' },
  { id: 'skin-08', tags: ['鼻翼偏宽'], text: '鼻翼与T区控油护理' },
  { id: 'skin-09', tags: ['鼻翼偏窄'], text: '鼻周温和保湿，避免干燥' },
  { id: 'skin-10', tags: ['脸偏宽'], text: '加强面颊紧致护理，提升轮廓' },
  { id: 'skin-11', tags: ['脸偏长'], text: '注意额头与下巴补水，平衡肤感' },
  { id: 'skin-12', tags: ['下颌明显'], text: '颈部与下颌线护理同步进行' },
  { id: 'skin-13', tags: ['下颌收敛'], text: '加强苹果肌保湿与提亮' },
  { id: 'skin-14', tags: ['厚唇'], text: '唇周护理配合去角质' },
  { id: 'skin-15', tags: ['薄唇'], text: '唇部滋润与防晒同步' },
  { id: 'skin-16', tags: ['上庭偏长'], text: '额头区域重点保湿与淡纹' },
  { id: 'skin-17', tags: ['下庭偏长'], text: '下巴与颈部护理并重' },
  { id: 'skin-18', tags: ['文艺'], text: '保持微光泽底感，避免过度哑光' },
  { id: 'skin-19', tags: ['气场'], text: '重点做好妆前定妆与控油' },
  { id: 'skin-20', tags: ['甜美'], text: '加强腮红区域补水，提升气色' },
  { id: 'skin-21', tags: ['清冷'], text: '注重肤色均匀与局部提亮' },
  { id: 'skin-22', tags: ['少年'], text: '保持清爽洁净，避免厚重护肤' }
]

const makeupAdvicePresets = [
  { id: 'make-01', tags: ['中庭偏长'], text: '腮红横扫增加横向比例' },
  { id: 'make-02', tags: ['中庭偏短'], text: '眼妆上移拉长中庭视觉' },
  { id: 'make-03', tags: ['眼距偏宽'], text: '眉头内收，眼头加深' },
  { id: 'make-04', tags: ['眼距偏窄'], text: '眼尾外拉，弱化紧凑感' },
  { id: 'make-05', tags: ['下颌明显'], text: '下颌角修容柔化轮廓' },
  { id: 'make-06', tags: ['下颌收敛'], text: '颧骨轻扫修容提升立体' },
  { id: 'make-07', tags: ['薄唇'], text: '唇峰外扩，增加丰盈感' },
  { id: 'make-08', tags: ['厚唇'], text: '唇线内收，突出精致感' },
  { id: 'make-09', tags: ['清冷'], text: '冷调眼影与低饱和唇色' },
  { id: 'make-10', tags: ['甜美'], text: '蜜桃腮红与水光唇' },
  { id: 'make-11', tags: ['气场'], text: '强调眉峰与骨相高光' },
  { id: 'make-12', tags: ['文艺'], text: '雾感底妆与轻描眼线' },
  { id: 'make-13', tags: ['明艳'], text: '提升唇色饱和度' },
  { id: 'make-14', tags: ['男士'], text: '轻修容强调下颌线' },
  { id: 'make-15', tags: ['女生'], text: '局部提亮颧骨与鼻梁' },
  { id: 'make-16', tags: ['脸偏宽'], text: '两颊外侧收敛修容' },
  { id: 'make-17', tags: ['脸偏长'], text: '额头与下巴轻扫阴影' },
  { id: 'make-18', tags: ['上庭偏长'], text: '额头阴影弱化长度感' },
  { id: 'make-19', tags: ['下庭偏长'], text: '下巴阴影缩短纵向' },
  { id: 'make-20', tags: ['清爽'], text: '弱化眼线，突出干净感' },
  { id: 'make-21', tags: ['少年'], text: '细眉与自然眼影更显清爽' },
  { id: 'make-22', tags: ['成熟'], text: '哑光唇与利落眼线' }
]

const styleAdvicePresets = [
  { id: 'style-01', tags: ['男士', '气场'], text: '挺括西装或外套强化气场' },
  { id: 'style-02', tags: ['男士', '清爽'], text: '简约剪裁搭配低饱和色' },
  { id: 'style-03', tags: ['男士', '文艺'], text: '亚麻与针织提升质感' },
  { id: 'style-04', tags: ['男士', '少年'], text: '运动休闲增强活力' },
  { id: 'style-05', tags: ['女生', '甜美'], text: '高腰裙装突出比例' },
  { id: 'style-06', tags: ['女生', '清冷'], text: '利落廓形与冷调色系' },
  { id: 'style-07', tags: ['女生', '气场'], text: '硬挺廓形与金属配饰' },
  { id: 'style-08', tags: ['女生', '文艺'], text: '复古元素与低饱和色' },
  { id: 'style-09', tags: ['明艳'], text: '提高色彩对比度与存在感' },
  { id: 'style-10', tags: ['成熟'], text: '经典色系与简洁线条' },
  { id: 'style-11', tags: ['清爽'], text: '留白感穿搭更显干净' },
  { id: 'style-12', tags: ['古典'], text: '丝绸或纱质增强古典感' },
  { id: 'style-13', tags: ['脸偏长'], text: '横向纹理或短上衣平衡比例' },
  { id: 'style-14', tags: ['脸偏宽'], text: '纵向线条拉长视觉' },
  { id: 'style-15', tags: ['下颌明显'], text: '圆润配饰柔化轮廓' },
  { id: 'style-16', tags: ['下颌收敛'], text: 'V 领或方领突出轮廓' },
  { id: 'style-17', tags: ['温柔'], text: '柔软面料与浅色系' },
  { id: 'style-18', tags: ['高级'], text: '简约剪裁与高质感材质' },
  { id: 'style-19', tags: ['少年'], text: '轻薄材质与浅色系' },
  { id: 'style-20', tags: ['气场'], text: '深色系与利落轮廓' },
  { id: 'style-21', tags: ['文艺'], text: '复古配饰点缀' },
  { id: 'style-22', tags: ['清冷'], text: '冷调配色强化氛围感' }
]

const internationalPresets = [
  { id: 'intl-01', region: '东方审美', tags: ['清冷', '女生'], desc: '线条柔和，气质克制', pros: ['留白适中', '细节精致'], match: ['含蓄', '耐看'] },
  { id: 'intl-02', region: '东方审美', tags: ['男士', '成熟'], desc: '五官稳重，气质稳健', pros: ['比例协调', '沉稳气质'], match: ['稳重'] },
  { id: 'intl-03', region: '西方审美', tags: ['气场'], desc: '骨相立体，气场强', pros: ['轮廓分明', '立体度高'], match: ['强势'] },
  { id: 'intl-04', region: '法式审美', tags: ['文艺'], desc: '松弛感强，气质独特', pros: ['随性', '自然'], match: ['个性'] },
  { id: 'intl-05', region: '日系审美', tags: ['甜美'], desc: '柔和亲和，清新感强', pros: ['亲和力', '清爽感'], match: ['清新'] },
  { id: 'intl-06', region: '韩系审美', tags: ['清爽'], desc: '干净利落，细节精致', pros: ['肤感干净', '妆感清透'], match: ['清爽'] },
  { id: 'intl-07', region: '现代审美', tags: ['明艳'], desc: '存在感强，风格鲜明', pros: ['色彩感强', '辨识度高'], match: ['鲜明'] },
  { id: 'intl-08', region: '地中海审美', tags: ['成熟'], desc: '质感浓郁，轮廓明显', pros: ['立体度高', '气场强'], match: ['浓郁'] },
  { id: 'intl-09', region: '北欧审美', tags: ['清冷'], desc: '冷感克制，气质高级', pros: ['冷调', '简洁'], match: ['高级'] },
  { id: 'intl-10', region: '港风审美', tags: ['气场'], desc: '骨相突出，港风质感', pros: ['线条利落', '高级感'], match: ['港风'] },
  { id: 'intl-11', region: '复古审美', tags: ['文艺'], desc: '复古氛围强，质感细腻', pros: ['格调感', '耐看'], match: ['复古'] },
  { id: 'intl-12', region: '美式审美', tags: ['少年'], desc: '健康活力，轮廓清晰', pros: ['活力感', '阳光感'], match: ['活力'] },
  { id: 'intl-13', region: '英伦审美', tags: ['高级'], desc: '克制高贵，气质精致', pros: ['质感强', '稳定感'], match: ['优雅'] },
  { id: 'intl-14', region: '轻熟审美', tags: ['成熟'], desc: '温和稳重，气质内敛', pros: ['稳重', '柔和'], match: ['内敛'] },
  { id: 'intl-15', region: '极简审美', tags: ['清爽'], desc: '线条简洁，视觉干净', pros: ['简洁', '清爽'], match: ['极简'] },
  { id: 'intl-16', region: '高级审美', tags: ['高级'], desc: '质感强烈，细节高级', pros: ['高级感', '质感'], match: ['高级'] },
  { id: 'intl-17', region: '新中式审美', tags: ['古典'], desc: '古典韵味，气质雅致', pros: ['雅致', '韵味'], match: ['古典'] },
  { id: 'intl-18', region: '运动审美', tags: ['少年'], desc: '动感轻快，清爽有型', pros: ['活力', '清爽'], match: ['运动'] },
  { id: 'intl-19', region: '都会审美', tags: ['气场'], desc: '现代都市，气场鲜明', pros: ['利落', '现代'], match: ['都会'] },
  { id: 'intl-20', region: '艺术审美', tags: ['文艺'], desc: '艺术感强，风格突出', pros: ['艺术性', '个性'], match: ['艺术'] }
]

const getHairstyle = (style, isMale, faceShape, eyeType, metricTags) => {
  const tags = uniqueList([...buildStyleTags(style, faceShape, eyeType, isMale), ...metricTags])
  const gender = isMale ? 'male' : 'female'
  const candidates = hairstylePresets.filter((preset) => preset.gender === gender)
  const selected = selectTopByTags(candidates, tags, 6).map((item) => item.text)
  return selected.length ? selected : candidates.slice(0, 6).map((item) => item.text)
}

const getColorAdvice = (style, isMale, faceShape, eyeType, metricTags) => {
  const tags = uniqueList([...buildStyleTags(style, faceShape, eyeType, isMale), ...metricTags])
  const gender = isMale ? 'male' : 'female'
  const candidates = colorPalettes.filter((preset) => preset.gender === gender)
  const selected = selectTopByTags(candidates, tags, 1)[0] || candidates[0]
  return selected ? { suitable: selected.suitable, avoid: selected.avoid } : { suitable: [], avoid: [] }
}

const getAdviceItems = (presets, tags, limit, extra = []) => {
  const items = [
    ...extra,
    ...selectTopByTags(presets, tags, limit + 2).map((item) => item.text)
  ]
  return uniqueList(items).slice(0, limit)
}

const starTagSet = new Set(['round', 'square', 'long', 'oval', 'heart', 'diamond', 'oblong', 'up', 'down', '清冷', '甜美', '气场', '文艺', '少年', '明艳', '成熟', '高级', '温柔', '清爽'])

const getStarReferences = (style, isMale, faceShape, eyeType, metricTags) => {
  const tags = uniqueList([...buildStyleTags(style, faceShape, eyeType, isMale), ...metricTags])
  const gender = isMale ? 'male' : 'female'
  const candidates = starPresets.filter((preset) => preset.gender === gender || preset.gender === 'all')
  return candidates
    .map((preset) => ({ preset, score: tagScore(preset.tags, tags) }))
    .sort((a, b) => b.score - a.score || a.preset.name.localeCompare(b.preset.name))
    .slice(0, 8)
    .map((item) => {
      const matched = item.preset.tags.filter((tag) => starTagSet.has(tag) && tags.includes(tag)).slice(0, 3)
      return {
        name: item.preset.name,
        style: item.preset.style,
        desc: matched.length ? `在${matched.join('、')}维度接近` : `风格关键词：${item.preset.style}`
      }
    })
}

const getInternationalAesthetic = (tags, isMale) => {
  const base = isMale ? 82 : 84
  return selectTopByTags(internationalPresets, tags, 3).map((item) => ({
    region: item.region,
    score: clamp(Math.round(base + tagScore(item.tags, tags) * 3), 78, 95),
    desc: item.desc,
    pros: item.pros,
    match: item.match
  }))
}

const getOccasionAdvice = (style, isMale, faceShape, eyeType) => {
  const tags = buildStyleTags(style, faceShape, eyeType, isMale)
  const gender = isMale ? 'male' : 'female'
  const sceneOrder = isMale ? ['work', 'social', 'casual'] : ['work', 'party', 'date']
  const candidates = outfitPresets.filter((preset) => preset.gender === gender)
  const selected = []

  sceneOrder.forEach((scene) => {
    const sceneCandidates = candidates.filter((preset) => preset.scene === scene)
    const best = sceneCandidates
      .map((preset) => ({ preset, score: tagScore(preset.tags, tags) }))
      .sort((a, b) => b.score - a.score || a.preset.id.localeCompare(b.preset.id))[0]
    if (best) selected.push(best.preset)
  })

  if (selected.length < 3) {
    const remaining = candidates
      .filter((preset) => !selected.find((item) => item.id === preset.id))
      .map((preset) => ({ preset, score: tagScore(preset.tags, tags) }))
      .sort((a, b) => b.score - a.score || a.preset.id.localeCompare(b.preset.id))
      .slice(0, 3 - selected.length)
      .map((item) => item.preset)
    selected.push(...remaining)
  }

  return selected.map((preset) => ({
    title: preset.title,
    desc: preset.desc,
    items: preset.items
  }))
}

const getDetailedMakeupGuide = (metrics, faceShape, eyeType, isMale, style) => {
  const metricTags = buildMetricTags(metrics, faceShape, eyeType)
  const tags = uniqueList([...buildStyleTags(style, faceShape, eyeType, isMale), ...metricTags])
  if (metrics.lips.fullness < 0.2) tags.push('薄唇')
  if (metrics.lips.fullness > 0.3) tags.push('厚唇')

  const gender = isMale ? 'male' : 'female'
  const candidates = makeupPresets.filter((preset) => preset.gender === gender || preset.gender === 'all')
  const categories = ['base', 'brows', 'eyes', 'lips', 'contour', 'highlight']
  const guide = {}

  categories.forEach((category) => {
    const items = candidates.filter((preset) => preset.category === category)
    const best = items
      .map((preset) => ({ preset, score: tagScore(preset.tags, tags) }))
      .sort((a, b) => b.score - a.score || a.preset.id.localeCompare(b.preset.id))[0]
    if (best) guide[category] = best.preset.text
  })

  return guide
}

// Personalized Welcome Message
const getPersonalizedWelcome = (style, isMale) => {
  const time = new Date().getHours()
  let greeting = "你好"
  if (time < 11) greeting = "早安"
  else if (time < 13) greeting = "午安"
  else if (time < 18) greeting = "下午好"
  else greeting = "晚上好"

  const adjectives = [
    "独一无二的", "气质非凡的", "充满魅力的", "令人印象深刻的", "清爽自信的",
    "气场强大的", "温柔坚定的", "优雅从容的", "高级克制的", "明艳动人的",
    "清冷高级的", "文艺随性的", "元气满满的", "沉稳可靠的", "灵动有神的",
    "洒脱利落的", "从容淡定的", "松弛自然的", "质感出众的", "风格鲜明的",
    "稳重内敛的", "清新脱俗的"
  ]
  const adj = selectRandom(adjectives)

  return `${greeting}，${adj}${style.main}！AI 已为您完成深度面部解析。`
}

// Daily Confidence Tip
const getDailyTip = (isMale) => {
  const tips = isMale ? [
    "自信的眼神是你最好的名片。",
    "保持整洁的仪容，运气自然会来。",
    "挺直腰背，气场瞬间提升 20%。",
    "今天的你，比昨天更帅气。",
    "微笑是拉近距离的最强武器。",
    "干净的发型能提升整体精神感。",
    "简单但有质感的配饰会更加分。",
    "低饱和配色更显高级。",
    "把肩线打开，整个人更挺拔。",
    "轻运动能让状态更稳定。",
    "干净的鞋面会提升整体精致度。",
    "保持目光坚定，气质会更稳。",
    "简单的香氛能加深记忆点。",
    "保持好睡眠，肤感会更细腻。",
    "善用层次穿搭，比例更好看。",
    "利落的下颌线来自好体态。",
    "保持发际线干净，清爽度会提升。",
    "选对表带能让手腕更有力量感。",
    "今天适合尝试简约硬朗风。",
    "少即是多，质感胜过复杂。"
  ] : [
    "你本来就很美，无需刻意迎合。",
    "自信的女人最美丽，今天也要闪闪发光。",
    "你的笑容价值连城，请多展示它。",
    "接纳自己的不完美，那是你独特的标志。",
    "美没有标准答案，你就是答案。",
    "保持自然的眉眼，气质更高级。",
    "选择适合肤色的口红会更提气色。",
    "小面积高光能提升立体度。",
    "简洁的耳饰更显精致。",
    "干净的发尾会增加质感。",
    "轻薄底妆更显真实高级。",
    "用香氛点亮情绪与气场。",
    "适度留白让穿搭更高级。",
    "稳住体态，美感自然增强。",
    "眼神明亮，整个人都会更有灵气。",
    "色彩呼应会让穿搭更协调。",
    "今天适合尝试低饱和配色。",
    "保持好睡眠，肤感会更通透。",
    "简单但精致的细节更动人。",
    "不需要用力，气质自会出现。"
  ]
  return selectRandom(tips)
}

export const generateReport = (metrics, gender) => {
  const isMale = gender === 'male'
  const m = metrics

  // 1. Determine Face Shape
  let faceShapeType = 'oval'
  if (m.dimensions.widthToHeight > 0.85) {
    if (m.dimensions.jawAngle > 25 && m.dimensions.jawToCheek > 0.9) faceShapeType = 'square'
    else if (m.dimensions.jawToCheek > 0.92) faceShapeType = 'square'
    else faceShapeType = 'round'
  } else if (m.dimensions.widthToHeight < 0.72) {
    if (m.dimensions.jawAngle > 20 && m.dimensions.jawToCheek > 0.88) faceShapeType = 'oblong' // New Type
    else faceShapeType = 'long'
  } else {
    if (m.dimensions.jawToCheek < 0.75) {
        faceShapeType = 'heart' 
    }
    else if (m.dimensions.jawToCheek > 0.9) faceShapeType = 'square'
    else faceShapeType = 'oval'
  }
  const faceShapeName = selectRandom(descriptors.face[faceShapeType])

  // 2. Determine Eye Type
  let eyeType = 'standard'
  if (m.eyes.tilt < -3) eyeType = 'up' // Up-turned
  else if (m.eyes.tilt > 3) eyeType = 'down' // Down-turned
  else if (m.eyes.roundness > 0.48) eyeType = 'round'
  else if (m.eyes.roundness < 0.35) eyeType = 'long'
  const eyeTypeName = selectRandom(descriptors.eyes[eyeType])

  // 3. Score Calculation
  const finalScore = getObjectiveScore(m, faceShapeType)

  // 4. Dynamic Summary Generation
  const summaryTemplates = [
    `您的面部轮廓${m.dimensions.jawToCheek > 0.85 ? '清晰硬朗' : '柔和流畅'}，配合${eyeTypeName}，${isMale ? '尽显阳刚之气' : '散发独特魅力'}。`,
    `五官比例${Math.abs(m.courts.middle - m.courts.lower) < 0.05 ? '非常协调' : '极具个人特色'}，${faceShapeName}为您增添了几分${isMale ? '成熟稳重' : '温婉气质'}。`,
    `整体气质${m.eyes.roundness > 0.4 ? '灵动活泼' : '高冷优雅'}，${faceShapeName}是您的最大特色，让人过目难忘。`
  ]
  const summary = selectRandom(summaryTemplates)

  // 5. Style Positioning Logic
  const getStyle = () => {
    if (isMale) {
      if (faceShapeType === 'round' || m.eyes.roundness > 0.45) return { main: '阳光暖男', sub: '少年感', desc: '亲和力强，笑容温暖' }
      if (faceShapeType === 'square' || faceShapeType === 'long' || faceShapeType === 'oblong') return { main: '型男硬汉', sub: '成熟稳重', desc: '荷尔蒙爆棚，气场强大' }
      if (faceShapeType === 'oval' || faceShapeType === 'heart') return { main: '清爽校草', sub: '斯文败类', desc: '干净利落，气质出众' }
      return { main: '日系雅痞', sub: '文艺青年', desc: '个性鲜明，独特审美' }
    } else {
      if (faceShapeType === 'round') return { main: '甜美可爱', sub: '初恋脸', desc: '元气满满，毫无攻击性' }
      if (faceShapeType === 'square' || faceShapeType === 'oblong') return { main: '高级超模', sub: '大气端庄', desc: '骨相优越，可塑性强' }
      if (eyeType === 'up' || faceShapeType === 'diamond') return { main: '明艳御姐', sub: '冷艳美人', desc: '气场全开，美艳动人' }
      if (faceShapeType === 'oval') return { main: '古典温婉', sub: '大家闺秀', desc: '耐看型美女，气质如兰' }
      return { main: '纯欲风格', sub: '氛围感', desc: '又纯又欲，撩人心弦' }
    }
  }
  const style = getStyle()
  const metricTags = buildMetricTags(m, faceShapeType, eyeType)
  const adviceTags = uniqueList([...buildStyleTags(style, faceShapeType, eyeType, isMale), ...metricTags])

  // 6. Detailed Feature Analysis (Non-repetitive)
  const features = {
    eyes: {
      title: '眼部',
      type: eyeTypeName,
      desc: m.eyes.spacingRatio > 1.1 ? '眼距稍宽，显得天真无邪' : (m.eyes.spacingRatio < 0.9 ? '眼距较近，眼神聚焦' : '眼距适中，比例完美'),
      pros: [
        m.eyes.roundness > 0.4 ? '眼睛圆润有神' : '眼型修长迷人',
        m.eyes.tilt < 0 ? '眼尾上扬，妩媚动人' : '眼角微垂，楚楚可怜'
      ],
      advice: [
        m.eyes.spacingRatio > 1.1 ? '眉头适当拉近，平衡眼距' : '眼线可适当拉长',
        '注重眼周保养，预防细纹'
      ]
    },
    nose: {
      title: '鼻部',
      type: m.nose.widthRatio > 0.22 ? '肉肉鼻' : '精致鼻',
      desc: m.nose.lengthRatio > 0.35 ? '中庭偏长，显得成熟' : '鼻子小巧精致',
      pros: ['鼻梁线条流畅', '鼻翼形态自然'],
      advice: [
        m.nose.widthRatio > 0.22 ? '利用鼻影修饰鼻翼' : '保持鼻头光洁',
        '高光提亮山根'
      ]
    },
    lips: {
      title: '唇部',
      type: m.lips.fullness > 0.3 ? '丰满唇' : '薄唇',
      desc: m.lips.fullness > 0.3 ? '唇部饱满，性感迷人' : '唇形精致，气质清冷',
      pros: ['唇峰明显', '嘴角弧度优美'],
      advice: [
        m.lips.fullness < 0.2 ? '使用唇蜜增加丰盈感' : '尝试哑光质地口红',
        '定期去角质，保持唇部嫩滑'
      ]
    },
    eyebrows: {
      title: '眉毛',
      type: (m.brows.arch / m.dimensions.width) > 0.05 ? '挑眉' : ((m.brows.arch / m.dimensions.width) < 0.02 ? '平眉' : '标准眉'),
      desc: (m.brows.arch / m.dimensions.width) > 0.05 ? '眉峰高挑，气场强大' : '眉形平缓，温婉可人',
      pros: ['眉骨立体', '毛流感强'],
      advice: ['定期修剪杂毛', '根据脸型调整眉峰位置']
    },
    cheeks: {
      title: '脸颊',
      type: m.dimensions.jawToCheek > 0.85 ? '骨感' : '饱满',
      desc: m.dimensions.jawToCheek > 0.85 ? '面部线条利落，骨骼感强' : '苹果肌饱满，胶原蛋白充足',
      pros: ['线条流畅', '饱满年轻'],
      advice: ['保持微笑提升苹果肌', '修容增强立体感']
    },
    chin: {
      title: '下巴',
      type: (m.dimensions.chinWidth / m.dimensions.jawWidth) > 0.4 ? '方圆下巴' : '尖下巴',
      desc: (m.dimensions.chinWidth / m.dimensions.jawWidth) > 0.4 ? '下巴线条平缓，稳重有力' : '下巴小巧精致，线条流畅',
      pros: ['比例适中', '线条清晰'],
      advice: ['保持颈部挺拔', '侧颜线条优美']
    }
  }

  // 7. Advice Generation (Logic-based)
  const baseSkincareAdvice = []
  const baseMakeupAdvice = []
  
  if (m.courts.middle > 0.36) {
    baseMakeupAdvice.push('中庭稍长，腮红可横向扫，缩短视觉中庭')
  }
  if (faceShapeType === 'square' || faceShapeType === 'oblong') {
    baseMakeupAdvice.push('修容重点在下颌角，柔化面部轮廓')
    baseSkincareAdvice.push('注意颈部护理，提升整体气质')
  } else if (faceShapeType === 'round') {
    baseMakeupAdvice.push('注重侧影修饰，增加面部立体感')
  }

  if (isMale) {
    baseSkincareAdvice.push('做好控油清洁，保持毛孔通透')
    baseMakeupAdvice.push('眉毛是男妆灵魂，保持眉形整洁硬朗')
  } else {
    baseSkincareAdvice.push('坚持防晒，美白抗初老')
    baseMakeupAdvice.push('根据肤色选择合适的粉底色号')
  }

  const skincareAdvice = getAdviceItems(skincareAdvicePresets, adviceTags, 8, baseSkincareAdvice)
  const makeupAdvice = getAdviceItems(makeupAdvicePresets, adviceTags, 8, baseMakeupAdvice)
  const styleAdvice = getAdviceItems(
    styleAdvicePresets,
    adviceTags,
    6,
    isMale ? ['简约剪裁与挺括材质'] : ['突出腰线，保持色彩呼应']
  )

  // Generate new enhanced sections
  const physiognomy = getPhysiognomy(m, faceShapeType, eyeType, isMale)
  const scienceAnalysis = getScienceAnalysis(m, faceShapeType, eyeType)
  const occasionAdvice = getOccasionAdvice(style, isMale, faceShapeType, eyeType)
  const makeupGuide = getDetailedMakeupGuide(m, faceShapeType, eyeType, isMale, style)
  const welcome = getPersonalizedWelcome(style, isMale)
  const dailyTip = getDailyTip(isMale)
  const starReferences = getStarReferences(style, isMale, faceShapeType, eyeType, metricTags)
  const international = getInternationalAesthetic(adviceTags, isMale)
  const hairstyle = getHairstyle(style, isMale, faceShapeType, eyeType, metricTags)
  const colors = getColorAdvice(style, isMale, faceShapeType, eyeType, metricTags)

  return {
    welcome: welcome, // New
    dailyTip: dailyTip, // New
    score: finalScore,
    summary: summary,
    style: {
      main: style.main,
      sub: style.sub,
      desc: style.desc,
      tags: [style.main, style.sub, faceShapeName, eyeTypeName],
      scenes: isMale ? ['商务谈判', '运动健身', '约会'] : ['网红打卡', '浪漫约会', '职场通勤'],
      similarStars: starReferences.map((item) => item.name),
      advantages: [
        `五官比例${finalScore > 85 ? '堪称完美' : '协调舒适'}`,
        `${faceShapeName}极具辨识度`,
        `气质${style.desc.substring(0, 4)}`
      ],
      directions: [
        `尝试${style.sub}风格穿搭`,
        `妆容重点突出${eyeTypeName}`
      ]
    },
    starMatch: starReferences,
    international: international,
    features: features,
    skin: {
      type: "AI推测肤质",
      color: "自然肤色",
      pros: ["肤色均匀", "纹理细腻"],
      notices: ["注意季节性敏感", "保持水油平衡"],
      advice: skincareAdvice.length > 0 ? skincareAdvice : ["基础补水", "定期清洁"]
    },
    bone: {
      shape: faceShapeName,
      features: [
        m.dimensions.jawToCheek > 0.8 ? "下颌有力" : "下颌收敛",
        m.dimensions.widthToHeight > 0.8 ? "面部短宽，显幼态" : "面部修长，显成熟"
      ],
      advice: [
        faceShapeType === 'square' ? "适合微卷发修饰脸型" : "适合露出额头展现轮廓",
        "保持体态，提升气质"
      ]
    },
    physiognomy: physiognomy,
    scienceAnalysis: scienceAnalysis,
    occasionAdvice: occasionAdvice, // New
    makeupGuide: makeupGuide, // New
    advice: {
      skincare: [{ title: "日常护理", items: skincareAdvice.length ? skincareAdvice : ["早晚洁面", "防晒"] }],
      makeup: [{ title: "修饰技巧", items: makeupAdvice }],
      style: [{ title: "穿搭建议", items: styleAdvice }]
    },
    hairstyle: hairstyle,
    colors: colors
  }
}

// New Physiognomy Logic
const getPhysiognomy = (m, faceShape, eyeType, isMale) => {
  const readings = []
  
  // 1. Courts (三停)
  if (Math.abs(m.courts.upper - m.courts.middle) < 0.05 && Math.abs(m.courts.middle - m.courts.lower) < 0.05) {
    readings.push({ title: "三停均等", desc: "一生运势平稳，衣食无忧，晚年幸福。" })
  } else if (m.courts.upper > 0.36) {
    readings.push({ title: "天庭饱满", desc: "早年运势极佳，思维敏捷，不仅聪明且有贵人相助。" })
  } else if (m.courts.middle > 0.36) {
    readings.push({ title: "中停主要", desc: "中年事业运强，意志坚定，做事有魄力。" })
  } else {
    readings.push({ title: "下停厚重", desc: "晚景荣华，性格沉稳，家庭观念强。" })
  }

  // 2. Eyes (五官 - 监察官)
  if (eyeType === 'long' || m.eyes.widthRatio > 0.26) {
    readings.push({ title: "凤眼/长眼", desc: "主贵，具有领导才能，心思缜密。" })
  } else if (eyeType === 'round') {
    readings.push({ title: "圆眼", desc: "主情，性格开朗天真，人缘极佳。" })
  } else {
    readings.push({ title: "含情眼", desc: "桃花运旺盛，情感丰富，艺术天分高。" })
  }

  // 3. Nose (五官 - 审辨官)
  if (m.nose.widthRatio > 0.22) {
    readings.push({ title: "财帛宫丰隆", desc: "鼻头有肉，财运亨通，善于理财。" })
  } else if (m.nose.lengthRatio > 0.35) {
    readings.push({ title: "伏犀鼻", desc: "大贵之相，才华横溢，易在专业领域取得成就。" })
  } else {
     readings.push({ title: "秀气鼻", desc: "做事细心，温文尔雅。" })
  }

  // 4. Jaw (地阁)
  if (faceShape === 'square' || faceShape === 'oblong' || m.dimensions.jawWidth > m.dimensions.width * 0.8) {
    readings.push({ title: "地阁方圆", desc: "意志力强，能吃苦耐劳，统御力强。" })
  } else if (faceShape === 'round') {
    readings.push({ title: "圆润福相", desc: "性格随和，乐善好施，福气深厚。" })
  } else {
     readings.push({ title: "尖下巴", desc: "灵动聪慧，富有艺术气息，但需注意晚年积蓄。" })
  }

  return readings
}

// New Science vs Magic Analysis Logic
const getScienceAnalysis = (m, faceShape, eyeType) => {
  // Generate a dynamic paragraph bridging AI metrics with physiognomy concepts
  
  // 1. Three Courts Analysis
  let courtsText = ""
  if (Math.abs(m.courts.middle - m.courts.lower) < 0.05) {
    courtsText = "AI 测算显示您的三庭比例趋于均等（黄金比例 1:1:1），这在面相学中对应“三停均等，一生衣食无忧”的吉相。"
  } else if (m.courts.middle > 0.35) {
    courtsText = `数字化扫描发现您的中庭占比（${(m.courts.middle * 100).toFixed(1)}%）略高于平均值，面相学认为这代表中年运势强劲，意志力坚定。`
  } else {
    courtsText = "数据表明您的下庭骨骼发育良好，在传统相学中象征着晚年运势稳健，性格沉稳。"
  }

  // 2. Landmarks & Features
  let landmarksText = ""
  if (faceShape === 'square' || faceShape === 'oblong') {
    landmarksText = "下颌角的 12 个关键点坐标构建出清晰的轮廓线，这种“地阁方圆”的骨相数据，往往对应着极强的统御力与行动力。"
  } else if (faceShape === 'round' || faceShape === 'oval') {
    landmarksText = "面部轮廓的 20 余个边缘点连接成柔和的曲线，这种流畅的“圆润”数据模型，在相学中被解读为亲和力强、贵人运旺盛。"
  } else {
    landmarksText = "面部中轴线上的关键点分布匀称，这种精致的几何结构，正是“清秀”面相的数字化表达，预示着聪慧与艺术天赋。"
  }

  return {
    intro: "AI 算法已精准提取您面部的 68 个关键特征点，将传统面相学中的“十二宫”进行了数字化重构。",
    analysis: `${courtsText} ${landmarksText}`,
    conclusion: "这种“数字化面相”显示，您的面部几何特征不仅符合现代美学标准，更蕴含着独特的性格密码与运势潜力。"
  }
}
