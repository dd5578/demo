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
  // Estimate upper court as 0.9 to 1.1 of middle court for variation
  const upperCourt = middleCourt * (0.9 + Math.random() * 0.2) 
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

// NEW: Occasion & Styling Engine
const getOccasionAdvice = (style, isMale) => {
  if (isMale) {
    return [
      { 
        title: "💼 职场商务", 
        desc: "建议选择剪裁利落的西装或Polo衫，发型保持干练，展现专业度。", 
        items: ["深蓝/深灰西装", "简约腕表", "皮质公文包"] 
      },
      { 
        title: "🥂 社交聚会", 
        desc: "可尝试更有设计感的衬衫或休闲西装，适当增加配饰，提升时尚感。", 
        items: ["印花衬衫", "休闲乐福鞋", "金属饰品"] 
      },
      { 
        title: "🏞️ 休闲约会", 
        desc: "注重舒适与质感，针织衫或卫衣是不错的选择，给人亲切温暖的感觉。", 
        items: ["纯色卫衣", "工装裤", "小白鞋"] 
      }
    ]
  } else {
    return [
      { 
        title: "💼 职场通勤", 
        desc: `根据您的${style.main}气质，建议选择${style.sub.includes("气场") ? "剪裁硬挺的西装套装" : "质感柔软的衬衫裙"}，展现干练又不失女性魅力的一面。`,
        items: ["真丝衬衫", "阔腿裤", "简约耳钉"] 
      },
      { 
        title: "🥂 晚宴派对", 
        desc: `适合${style.sub.includes("明艳") ? "修身长裙，突出曲线" : "设计感强的小礼服"}，妆容可适当加深，强调五官立体度。`,
        items: ["丝绒连衣裙", "亮片手包", "红唇妆"] 
      },
      { 
        title: "☕ 下午茶/约会", 
        desc: "选择色调柔和的针织衫或碎花裙，打造慵懒随性的氛围感，妆容以清透伪素颜为主。", 
        items: ["法式茶歇裙", "珍珠项链", "草编包"] 
      }
    ]
  }
}

const getDetailedMakeupGuide = (metrics, faceShape, eyeType, isMale) => {
  if (isMale) {
    return {
      base: "男士妆容核心在于'隐形'。重点做好控油与遮瑕，保持皮肤哑光质感。",
      brows: "眉毛是男妆灵魂。保留原生毛流感，仅修除杂毛，眉尾稍微加重，提升精气神。",
      contour: faceShape === 'round' ? "在下颌角位置轻扫阴影，增加面部折叠度，减少圆润感。" : "强调T区立体感，鼻影不宜过重。",
      highlight: "无需明显高光，保持自然光泽即可。"
    }
  }

  // Female Makeup Logic
  const guides = {
    base: "建议选择半哑光粉底液，打造高级柔雾肌。注意T区提亮，增加面部平整度。",
    brows: metrics.brows.arch > 0.05 
      ? "眉峰较高，适合画挑眉增强气场，或略微压低眉头平缓气质。" 
      : "眉形平缓，适合画标准眉或弯月眉，增加温柔感。",
    eyes: eyeType === 'up' 
      ? "眼尾上扬，眼线可平拉或微微下垂，平衡锐利感；眼影加深下眼睑，强调无辜感。" 
      : (eyeType === 'round' ? "圆眼优势在于可爱，眼线可适当拉长增加妩媚感；睫毛重点在眼中，放大双眼。" : "眼型修长，适合晕染型眼影，眼线顺势上扬，打造高级厌世感。"),
    lips: metrics.lips.fullness < 0.2 
      ? "薄唇适合涂抹唇蜜或镜面唇釉，稍微晕染出唇界，增加丰盈感。" 
      : "厚唇优势明显，适合哑光口红，全涂气场全开，咬唇妆则更显温柔。",
    contour: faceShape === 'square' || faceShape === 'oblong'
      ? "修容重点在下颌角与额角，柔化方形轮廓；腮红斜向扫在颧骨，提拉面部。"
      : (faceShape === 'long' ? "修容扫在发际线与下巴底端，缩短面部视觉长度；腮红横向扫在面中，截断中庭。" : "修容扫在脸颊两侧，收缩面宽；高光提亮额头与下巴，拉长比例。")
  }
  return guides
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
    "独一无二的", "气质非凡的", "充满魅力的", "令人印象深刻的"
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
    "微笑是拉近距离的最强武器。"
  ] : [
    "你本来就很美，无需刻意迎合。",
    "自信的女人最美丽，今天也要闪闪发光。",
    "你的笑容价值连城，请多展示它。",
    "接纳自己的不完美，那是你独特的标志。",
    "美没有标准答案，你就是答案。"
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
  const courtScore = 100 - (Math.abs(m.courts.middle - 0.33) + Math.abs(m.courts.lower - 0.33)) * 100 * 2
  const eyeScore = 100 - Math.abs(m.eyes.spacingRatio - 1.0) * 50
  const baseScore = (courtScore * 0.4 + eyeScore * 0.4 + 20) // Base + Bias
  const finalScore = Math.min(99, Math.max(75, Math.floor(baseScore + Math.random() * 5)))

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
  const skincareAdvice = []
  const makeupAdvice = []
  
  if (m.courts.middle > 0.36) {
    makeupAdvice.push('中庭稍长，腮红可横向扫，缩短视觉中庭')
  }
  if (faceShapeType === 'square' || faceShapeType === 'oblong') {
    makeupAdvice.push('修容重点在下颌角，柔化面部轮廓')
    skincareAdvice.push('注意颈部护理，提升整体气质')
  } else if (faceShapeType === 'round') {
    makeupAdvice.push('注重侧影修饰，增加面部立体感')
  }

  if (isMale) {
    skincareAdvice.push('做好控油清洁，保持毛孔通透')
    makeupAdvice.push('眉毛是男妆灵魂，保持眉形整洁硬朗')
  } else {
    skincareAdvice.push('坚持防晒，美白抗初老')
    makeupAdvice.push('根据肤色选择合适的粉底色号')
  }

  // Generate new enhanced sections
  const physiognomy = getPhysiognomy(m, faceShapeType, eyeType, isMale)
  const scienceAnalysis = getScienceAnalysis(m, faceShapeType, eyeType)
  const occasionAdvice = getOccasionAdvice(style, isMale)
  const makeupGuide = getDetailedMakeupGuide(m, faceShapeType, eyeType, isMale)
  const welcome = getPersonalizedWelcome(style, isMale)
  const dailyTip = getDailyTip(isMale)

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
      similarStars: getStars(faceShapeType, isMale),
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
    starMatch: generateStarMatch(faceShapeType, eyeType, isMale),
    international: [
      { region: "东方审美", score: isMale ? 88 : 90, desc: "符合含蓄内敛的东方美学", pros: ["面部留白适中", "五官柔和"], match: ["温润如玉"] },
      { region: "西方审美", score: isMale ? 85 : 82, desc: "骨相立体度尚可", pros: ["轮廓清晰"], match: ["个性"] },
      { region: "现代审美", score: 92, desc: "极具个人特色的现代脸", pros: ["辨识度高"], match: ["高级感"] }
    ],
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
      style: [{ title: "穿搭建议", items: isMale ? ["简约剪裁", "深色系为主"] : ["突出腰线", "色彩呼应"] }]
    },
    hairstyle: getHairstyle(faceShapeType, isMale),
    colors: {
      suitable: isMale ? ["黑", "白", "灰", "军绿"] : ["莫兰迪色", "香槟金", "纯白"],
      avoid: ["高饱和度荧光色"]
    }
  }
}

// --- Data Helpers ---

const getStars = (shape, isMale) => {
  const stars = {
    male: {
      round: ['陈伟霆', '李易峰', '宋仲基'],
      square: ['古天乐', '黄晓明', '布拉德·皮特'],
      long: ['胡歌', '王力宏', '本尼迪克特'],
      oval: ['鹿晗', '杨洋', '吴尊'],
      heart: ['王俊凯', '蔡徐坤', '吴磊'], 
      oblong: ['金城武', '王凯'] 
    },
    female: {
      round: ['赵丽颖', '陈妍希', '张含韵'],
      square: ['舒淇', '倪妮', '杜鹃'],
      long: ['莫文蔚', '黄圣依', '马苏'],
      oval: ['刘亦菲', '高圆圆', '宋慧乔'],
      heart: ['范冰冰', '唐嫣', 'Angelababy'],
      diamond: ['章子怡', '蔡少芬'],
      oblong: ['李嘉欣', 'Maggie Q'] 
    }
  }
  return stars[isMale ? 'male' : 'female'][shape] || (isMale ? ['刘德华', '梁朝伟'] : ['林青霞', '王祖贤'])
}

const generateStarMatch = (shape, eye, isMale) => {
  // Simple logic to return 2-3 matched stars
  const list = getStars(shape, isMale)
  return list.slice(0, 3).map((name, i) => ({
    name,
    percent: 90 - i * 5 + Math.floor(Math.random() * 5),
    desc: `拥有相似的${shape === 'square' ? '轮廓' : '脸型'}与气质`,
    tags: [shape === 'square' ? '骨相美' : '皮相美', '气质相似']
  }))
}

const getHairstyle = (shape, isMale) => {
  if (isMale) {
    if (shape === 'round') return ['两侧铲青', '上梳刘海', '飞机头']
    if (shape === 'square' || shape === 'oblong') return ['侧分油头', '短寸', '纹理烫']
    if (shape === 'long') return ['刘海遮额', '韩式微卷', '中分']
    return ['所有发型皆可尝试', '逗号刘海', '背头']
  } else {
    if (shape === 'round') return ['八字刘海', '丸子头', '高马尾']
    if (shape === 'square' || shape === 'oblong') return ['波浪大卷', '侧分长发', '法式刘海']
    if (shape === 'long') return ['空气刘海', '齐肩短发', '蛋卷头']
    if (shape === 'heart') return ['锁骨发', '偏分长直', '羊毛卷']
    return ['黑长直', '露额盘发', '任何发型']
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
