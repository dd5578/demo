<template>
  <div class="face-analyzer-container">
    <div class="main-frame-outer">
      <div class="main-frame-inner">
        <!-- 装饰角标 -->
        <div class="corner-deco tl"></div>
        <div class="corner-deco tr"></div>
        <div class="corner-deco bl"></div>
        <div class="corner-deco br"></div>

        <div class="header">
          <h1>美学解析书</h1>
          <div class="subtitle">AESTHETICS & PHYSIOGNOMY REPORT</div>
        </div>

        <!-- Input Section -->
        <div v-if="!analysisResult" class="input-section">
          
          <el-tabs v-model="activeTab" class="custom-tabs" stretch>
            <el-tab-pane label="上传照片" name="upload">
              <div class="upload-box">
                <el-upload
                  class="avatar-uploader"
                  action="#"
                  :show-file-list="false"
                  :auto-upload="false"
                  :on-change="handleFileChange"
                  drag
                >
                  <img v-if="imageUrl" :src="imageUrl" class="avatar" id="face-image" />
                  <div v-else class="upload-placeholder-content">
                    <div style="font-size: 30px; margin-bottom: 10px;">❦</div>
                    <div>点击载入影像</div>
                    <div style="font-size: 12px; color: #999; margin-top: 5px;">IMAGE UPLOAD</div>
                  </div>
                </el-upload>
              </div>
            </el-tab-pane>
            <el-tab-pane label="摄像头实时分析" name="camera">
              <div class="camera-container">
                <div class="video-wrapper">
                  <video ref="video" autoplay playsinline class="video-feed" v-show="isCameraOpen"></video>
                  <div v-if="!isCameraOpen" class="camera-placeholder-box">
                    <el-icon :size="50"><Camera /></el-icon>
                  </div>
                </div>
                <canvas ref="canvas" style="display: none;"></canvas>
                
                <div class="camera-controls">
                  <button v-if="!isCameraOpen" class="btn-classic" @click="startCamera">开启摄像头</button>
                  <template v-else>
                    <button class="btn-classic danger" @click="stopCamera">关闭</button>
                    <button class="btn-classic success" @click="captureImage">拍照并分析</button>
                  </template>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>

          <div class="actions" v-if="imageUrl && activeTab === 'upload'">
            <button class="btn-classic main-action" @click="analyzeFace" :disabled="analyzing">
              {{ analyzing ? '能量解析中...' : '开始解析' }}
            </button>
          </div>

          <div class="gender-selection">
            <h3 class="instruction-text">请选择您的性别以获得精准分析</h3>
            <div class="gender-options">
              <div 
                class="gender-option" 
                :class="{ active: gender === 'female' }"
                @click="gender = 'female'"
              >
                <span>👧 女生</span>
              </div>
              <div 
                class="gender-option" 
                :class="{ active: gender === 'male' }"
                @click="gender = 'male'"
              >
                <span>👦 男生</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Result Section -->
        <div v-else class="result-section">
          <div class="result-actions">
             <button class="btn-classic small" @click="resetAnalysis">重新分析</button>
             <button class="btn-classic small" @click="downloadReport">下载报告</button>
          </div>

          <!-- 1. Score & Summary with Radar -->
          <div class="hero-section">
            <div class="radar-chart-container">
              <div class="radar-chart" ref="radarChartRef"></div>
              <div class="score-display">
                <span class="score-val">{{ analysisResult.score }}</span>
                <span class="score-label">总评分</span>
              </div>
            </div>

            <div class="summary-text-box">
              <h2 class="welcome-text">{{ analysisResult.welcome }}</h2>
              <div class="summary-content">
                <strong>“{{ analysisResult.style.main }}”</strong><br><br>
                {{ analysisResult.summary }}
              </div>
              <div class="daily-tip-box">
                <span class="tip-icon">💡</span>
                <span class="tip-text">{{ analysisResult.dailyTip }}</span>
              </div>
            </div>
          </div>

          <!-- Science vs Magic -->
          <!-- Moved to the end as requested -->

          <!-- 2. Style Positioning -->
          <div class="section-block">
            <div class="block-title">风格定位 / STYLE</div>
            <div class="style-card">
              <div class="style-main">{{ analysisResult.style.main }}</div>
              <div class="style-sub">{{ analysisResult.style.sub }}</div>
              <div class="style-desc">{{ analysisResult.style.desc }}</div>
              
              <div class="tags-container">
                <span v-for="tag in analysisResult.style.tags" :key="tag" class="tag"># {{ tag }}</span>
              </div>

              <div class="style-info-grid">
                <div class="info-group">
                  <span class="label">适合场景</span>
                  <div class="mini-tags">
                    <span v-for="scene in analysisResult.style.scenes" :key="scene">{{ scene }}</span>
                  </div>
                </div>
                <div class="info-group">
                  <span class="label">参考明星风格</span>
                  <div class="star-text">
                     {{ analysisResult.style.similarStars.join(' | ') }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Physiognomy (New Layout) -->
          <div class="section-block" v-if="analysisResult.physiognomy">
            <div class="block-title">面相灵解 / PHYSIOGNOMY</div>
            <div class="physio-grid">
              <div v-for="(reading, index) in analysisResult.physiognomy" :key="index" class="physio-item">
                <div class="physio-icon-small">{{ ['☯️', '👁️', '👃', '🏔️'][index] || '✨' }}</div>
                <strong>{{ reading.title }}</strong>
                {{ reading.desc }}
              </div>
            </div>
          </div>

          <!-- Star Match -->
          <div class="section-block" v-if="analysisResult.starMatch">
            <div class="block-title">参考明星风格 / CELEBRITY</div>
            <div class="star-legend">说明：oval=鹅蛋脸、round=圆脸、square=方脸、long=长脸、heart=心形脸、diamond=菱形脸、oblong=长方脸、up=上扬眼、down=下垂眼，其余为风格气质标签。</div>
            <div class="star-grid">
              <div v-for="star in analysisResult.starMatch" :key="star.name" class="star-card">
                <div class="star-name">{{ star.name }}</div>
                <div class="star-style">{{ star.style }}</div>
                <div class="star-desc">{{ star.desc }}</div>
              </div>
            </div>
          </div>

          <!-- International Aesthetic -->
          <div class="section-block" v-if="analysisResult.international">
            <div class="block-title">国际审美 / AESTHETIC</div>
            <div class="intl-grid">
              <div v-for="item in analysisResult.international" :key="item.region" class="intl-card">
                <div class="intl-region">{{ item.region }}</div>
                <div class="intl-score">{{ item.score }} <span class="score-unit">分</span></div>
                <div class="intl-desc">{{ item.desc }}</div>
                <div class="intl-tags">
                  <span v-for="pro in item.pros" :key="pro">{{ pro }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bone & Skin -->
          <div class="section-block" v-if="analysisResult.bone && analysisResult.skin">
             <div class="block-title">骨相与皮相 / BONE & SKIN</div>
             <div class="dual-col-grid">
               <!-- Bone -->
               <div class="dual-col">
                 <h4 class="sub-title">🦴 骨相分析</h4>
                 <div class="info-row">
                   <span class="label">脸型:</span> {{ analysisResult.bone.shape }}
                 </div>
                 <ul class="dot-list">
                   <li v-for="f in analysisResult.bone.features" :key="f">{{ f }}</li>
                   <li v-for="a in analysisResult.bone.advice" :key="a" class="highlight">{{ a }}</li>
                 </ul>
               </div>
               <!-- Skin -->
               <div class="dual-col">
                 <h4 class="sub-title">🦢 皮相分析</h4>
                 <div class="info-row">
                   <span class="label">肤质:</span> {{ analysisResult.skin.type }}
                 </div>
                 <div class="info-row">
                   <span class="label">肤色:</span> {{ analysisResult.skin.color }}
                 </div>
                 <ul class="dot-list">
                   <li v-for="n in analysisResult.skin.notices" :key="n">{{ n }}</li>
                 </ul>
               </div>
             </div>
          </div>

          <!-- 4. Detailed Features -->
          <div class="section-block features">
            <div class="block-title">五官解析 / FEATURES</div>
            <div class="features-list-grid">
              <div v-for="(feature, key) in analysisResult.features" :key="key" class="feature-card-simple">
                <div class="feature-head">
                  <span class="f-icon">{{ getFeatureIcon(key) }}</span>
                  <span class="f-name">{{ feature.title }}</span>
                  <span class="f-type">{{ feature.type }}</span>
                </div>
                <p class="f-desc">{{ feature.desc }}</p>
                <div class="f-advice">
                  <span class="advice-label">建议:</span>
                  <span v-for="adv in feature.advice" :key="adv">{{ adv }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Makeup Guide -->
          <div class="section-block makeup-guide" v-if="analysisResult.makeupGuide">
            <div class="block-title">定制妆容 / MAKEUP</div>
            <div class="makeup-simple-list">
              <div class="makeup-row" v-for="(desc, part) in analysisResult.makeupGuide" :key="part">
                <div class="makeup-label">
                  {{ part === 'base' ? '底妆' : (part === 'brows' ? '眉妆' : (part === 'eyes' ? '眼妆' : (part === 'lips' ? '唇妆' : (part === 'contour' ? '修容' : (part === 'highlight' ? '高光' : part))))) }}
                </div>
                <div class="makeup-text">{{ desc }}</div>
              </div>
            </div>
          </div>

          <!-- 6. Occasion Advice -->
          <div class="section-block occasion-advice" v-if="analysisResult.occasionAdvice">
            <div class="block-title">场景穿搭 / OUTFIT</div>
            <div class="occasion-grid-retro">
              <div v-for="(advice, index) in analysisResult.occasionAdvice" :key="index" class="occasion-card-retro">
                <div class="occ-title">{{ advice.title }}</div>
                <p class="occ-desc">{{ advice.desc }}</p>
                <div class="occ-items">
                  <span v-for="item in advice.items" :key="item">✦ {{ item }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 7. Comprehensive Advice (Accordion) -->
           <div class="section-block">
             <div class="block-title">全方位指南 / GUIDE</div>
             <el-collapse v-model="activeNames" accordion class="retro-collapse">
              <el-collapse-item title="🧴 基础护肤" name="1">
                <ul class="advice-list-retro">
                  <li v-for="item in analysisResult.advice.skincare[0].items" :key="item">{{ item }}</li>
                </ul>
              </el-collapse-item>
              <el-collapse-item title="💄 进阶修饰" name="2">
                <ul class="advice-list-retro">
                  <li v-for="item in analysisResult.advice.makeup[0].items" :key="item">{{ item }}</li>
                </ul>
              </el-collapse-item>
              <el-collapse-item title="👗 风格穿搭" name="3">
                <ul class="advice-list-retro">
                  <li v-for="item in analysisResult.advice.style[0].items" :key="item">{{ item }}</li>
                </ul>
              </el-collapse-item>
            </el-collapse>
           </div>
          
          <!-- Hairstyle & Colors -->
          <div class="section-block" v-if="analysisResult.hairstyle">
            <div class="block-title">发型与色彩 / STYLE GUIDE</div>
            <div class="style-guide-grid">
              <div class="guide-box">
                 <h4 class="guide-title">💇‍♀️ 推荐发型</h4>
                 <div class="tag-cloud">
                   <span v-for="hair in analysisResult.hairstyle" :key="hair" class="hair-tag">{{ hair }}</span>
                 </div>
              </div>
              <div class="guide-box">
                 <h4 class="guide-title">🎨 色彩建议</h4>
                 <div class="color-rec">
                   <div class="color-group">
                     <span class="c-label">适合:</span>
                     <span v-for="c in analysisResult.colors.suitable" :key="c">{{ c }}</span>
                   </div>
                   <div class="color-group avoid">
                     <span class="c-label">避免:</span>
                     <span v-for="c in analysisResult.colors.avoid" :key="c">{{ c }}</span>
                   </div>
                 </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer-note">
            ✦ 影像仅用于本地解析，能量不外泄 ✦
          </div>

          <!-- Science vs Magic (Moved to End) -->
          <div class="section-block science-block" v-if="analysisResult.scienceAnalysis">
            <div class="block-title-premium">
              <span class="deco-l">☙</span> 科学与玄学 <span class="deco-r">❧</span>
            </div>
            <div class="science-content-premium">
              <p class="science-intro">{{ analysisResult.scienceAnalysis.intro }}</p>
              <div class="science-body">
                <span class="quote-mark-l">“</span>
                {{ analysisResult.scienceAnalysis.analysis }}
                <span class="quote-mark-r">”</span>
              </div>
              <div class="science-divider">
                <span class="line"></span>
                <span class="star">★</span>
                <span class="line"></span>
              </div>
              <p class="science-conclusion">{{ analysisResult.scienceAnalysis.conclusion }}</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { UploadFilled, Camera, Close, Picture, Download, Trophy, TrendCharts, Check, MagicStick } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as faceapi from 'face-api.js'
import * as echarts from 'echarts'
import { analyzeFaceMetrics, generateReport } from '../utils/analysis.js'

const activeTab = ref('upload')
const imageUrl = ref('')
const isCameraOpen = ref(false)
const video = ref(null)
const canvas = ref(null)
const analyzing = ref(false)
const analysisResult = ref(null)
const activeNames = ref(['1'])
const gender = ref('female')
const modelsLoaded = ref(false)
const radarChartRef = ref(null)
let chartInstance = null

// Load Face API Models
onMounted(async () => {
  try {
    const modelUrl = 'https://justadudewhohacks.github.io/face-api.js/models'
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl),
      faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
    ])
    modelsLoaded.value = true
    console.log('FaceAPI models loaded')
  } catch (error) {
    console.error('Failed to load models:', error)
    ElMessage.warning('AI模型加载较慢或失败，将使用模拟分析模式')
  }
})

// Initialize Radar Chart when result is ready
watch(analysisResult, async (newVal) => {
  if (newVal && newVal.score) {
    await nextTick()
    initRadarChart(newVal)
  }
})

const initRadarChart = (result) => {
  if (!radarChartRef.value) return
  
  if (chartInstance) {
    chartInstance.dispose()
  }
  
  chartInstance = echarts.init(radarChartRef.value)
  
  const option = {
    backgroundColor: 'transparent',
    radar: {
      indicator: [
        { name: '骨相', max: 100 },
        { name: '皮相', max: 100 },
        { name: '五官', max: 100 },
        { name: '风格', max: 100 },
        { name: '比例', max: 100 }
      ],
      shape: 'polygon',
      splitNumber: 2,
      axisName: {
        color: '#666',
        fontFamily: 'Songti SC, serif',
        fontSize: 10
      },
      splitLine: {
        lineStyle: {
          color: ['#e0e0e0', '#e0e0e0']
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: '#eee'
        }
      }
    },
    series: [
      {
        name: '美学分析',
        type: 'radar',
        lineStyle: {
          width: 2,
          color: '#9d8ec3'
        },
        areaStyle: {
          color: 'rgba(157, 142, 195, 0.3)'
        },
        data: [
          {
            value: [
              85 + Math.random() * 10, 
              90 + Math.random() * 5, 
              88 + Math.random() * 8, 
              95, 
              result.score
            ],
            name: '当前状态'
          }
        ]
      }
    ]
  }
  
  chartInstance.setOption(option)
}

// Handle File Upload
const handleFileChange = (uploadFile) => {
  imageUrl.value = URL.createObjectURL(uploadFile.raw)
}

// Camera Logic
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 720 },
        height: { ideal: 960 },
        aspectRatio: { ideal: 0.75 }
      }
    })
    if (video.value) {
      video.value.srcObject = stream
      isCameraOpen.value = true
    }
  } catch (err) {
    ElMessage.error('无法访问摄像头: ' + err.message)
  }
}

const stopCamera = () => {
  if (video.value && video.value.srcObject) {
    const tracks = video.value.srcObject.getTracks()
    tracks.forEach(track => track.stop())
    video.value.srcObject = null
    isCameraOpen.value = false
  }
}

const captureImage = () => {
  if (video.value && canvas.value) {
    const context = canvas.value.getContext('2d')
    canvas.value.width = video.value.videoWidth
    canvas.value.height = video.value.videoHeight
    context.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height)
    imageUrl.value = canvas.value.toDataURL('image/png')
    stopCamera()
    activeTab.value = 'upload'
  }
}

const analyzeFace = async () => {
  if (!imageUrl.value) return
  
  analyzing.value = true
  
  try {
    const imageElement = document.getElementById('face-image')
    
    // Default mock data if models fail or for demo
    let detections = null
    
    if (modelsLoaded.value && imageElement) {
      try {
        detections = await faceapi.detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks()
      } catch (e) {
        console.warn('FaceAPI detection failed, falling back to mock', e)
      }
    }
    
    // Simulate API delay
    setTimeout(() => {
      try {
        const metrics = analyzeFaceMetrics(detections, gender.value)
        analysisResult.value = generateReport(metrics, gender.value)
        nextTick(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' })
        })
      } catch (innerError) {
        console.error('Analysis logic error:', innerError)
        ElMessage.error('生成分析报告时出错')
      } finally {
        analyzing.value = false
      }
    }, 1500)
    
  } catch (error) {
    console.error(error)
    analyzing.value = false
    ElMessage.error('分析过程中出现错误')
  }
}

const resetAnalysis = () => {
  analysisResult.value = null
  imageUrl.value = ''
  activeTab.value = 'upload'
}

const downloadReport = () => {
  ElMessage.success('报告下载功能开发中...')
}

const getFeatureIcon = (key) => {
  const icons = {
    eyes: '👁️',
    nose: '👃',
    lips: '�',
    face: '🧒'
  }
  return icons[key] || '📝'
}
</script>

<style>
/* High-End Design System Updates */
:root {
  --premium-gold: var(--accent-gold);
  --premium-gold-dark: #8d6e3f;
  --premium-bg: #fdfdfd;
  --premium-shadow: 0 20px 50px rgba(100, 100, 100, 0.1);
  --premium-border: 1px solid rgba(207, 170, 110, 0.3);
}

.face-analyzer-container {
  display: flex;
  justify-content: center;
  padding: 40px 20px;
}

.main-frame-outer {
  width: 100%;
  max-width: 800px;
  background: rgba(255, 255, 255, 0.85);
  padding: 15px;
  box-shadow: var(--premium-shadow);
  border: 1px solid #fff;
}

.main-frame-inner {
  border: 2px solid var(--text-primary);
  padding: 40px;
  position: relative;
  background: var(--premium-bg);
}

.corner-deco {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid var(--text-primary);
  background: #fff;
}
.tl { top: -6px; left: -6px; border-right: none; border-bottom: none; }
.tr { top: -6px; right: -6px; border-left: none; border-bottom: none; }
.bl { bottom: -6px; left: -6px; border-right: none; border-top: none; }
.br { bottom: -6px; right: -6px; border-left: none; border-top: none; }

/* Header */
.header {
  text-align: center;
  margin-bottom: 40px;
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.header h1 {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: normal;
  letter-spacing: 5px;
  margin: 0 0 15px 0;
  color: var(--text-primary);
  text-shadow: 2px 2px 0 rgba(0,0,0,0.05);
}

.header .subtitle {
  font-family: 'Times New Roman', serif;
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--text-secondary);
  text-transform: uppercase;
}

/* Input Section */
.input-section {
  text-align: center;
  animation: fadeIn 0.5s ease;
}

.instruction-text {
  font-weight: normal;
  color: var(--text-secondary);
  margin-bottom: 20px;
}

.gender-options {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 15px 0 0;
}

.gender-selection {
  margin-top: 30px;
}

.gender-option {
  padding: 10px 30px;
  border: 1px solid #ddd;
  cursor: pointer;
  transition: all 0.3s;
  font-family: var(--font-serif);
}

.gender-option.active, .gender-option:hover {
  border-color: var(--text-primary);
  background: var(--text-primary);
  color: #fff;
}

/* Upload Box */
.upload-box {
  border: 1px dashed var(--line-color);
  padding: 60px 20px;
  margin: 0 auto 30px;
  max-width: 400px;
  background: #fafafa;
  transition: all 0.3s;
}

.upload-box:hover {
  border-color: var(--accent-gold);
  background: #fff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
}

.camera-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.video-wrapper {
  width: 100%;
  max-width: 360px;
  aspect-ratio: 3 / 4;
  background: #f7f3ec;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder-content {
  padding: 40px;
  color: var(--text-primary);
}

.avatar {
  max-width: 100%;
  max-height: 350px;
  filter: sepia(10%) contrast(1.05);
  border: 8px solid #fff;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

/* Classic Button */
.btn-classic {
  background: transparent;
  border: 1px solid var(--text-primary);
  color: var(--text-primary);
  padding: 12px 40px;
  font-family: var(--font-serif);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  margin: 0 10px;
}

.btn-classic:hover {
  background: var(--text-primary);
  color: #fff;
}

.btn-classic.small {
  padding: 8px 20px;
  font-size: 14px;
}

.btn-classic.danger:hover {
  background: #ff7875;
  border-color: #ff7875;
}

.btn-classic.success:hover {
  background: #95de64;
  border-color: #95de64;
}

.btn-classic:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Result Section */
.result-section {
  animation: fadeIn 1s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.result-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30px;
}

/* Hero Section with Radar */
.hero-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  margin-bottom: 40px;
  gap: 40px;
}

.radar-chart-container {
  width: 260px;
  height: 260px;
  position: relative;
}

.radar-chart {
  width: 100%;
  height: 100%;
}

.score-display {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  font-family: 'Times New Roman', serif;
}

.score-val {
  font-size: 36px;
  color: var(--accent-gold);
  font-weight: bold;
}

.score-label {
  font-size: 12px;
  color: #999;
  display: block;
}

.summary-text-box {
  flex: 1;
  min-width: 300px;
}

.welcome-text {
  font-size: 26px;
  font-weight: normal;
  margin-bottom: 25px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding-bottom: 15px;
  color: #333;
}

.summary-content {
  text-align: justify;
  line-height: 1.8;
  font-size: 14px;
  border-left: 2px solid var(--accent-gold);
  padding-left: 20px;
  margin-bottom: 25px;
  color: #555;
}

.daily-tip-box {
  background: #fff9f0;
  border: 1px dashed var(--accent-gold);
  padding: 15px;
  color: #8d6e3f;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 15px;
  border-radius: 4px;
}

/* Section Blocks */
.section-block {
  margin-bottom: 40px;
  border: 1px solid #eee;
  background: rgba(255,255,255,0.5);
  padding: 25px;
  position: relative;
  overflow: hidden;
}

.block-title {
  text-align: center;
  font-size: 18px;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--accent-gold);
  display: inline-block;
  padding-bottom: 5px;
  position: relative;
  left: 50%;
  transform: translateX(-50%);
  color: var(--text-primary);
}

/* Style Card */
.style-card {
  text-align: center;
}

.style-main {
  font-size: 24px;
  margin-bottom: 5px;
}

.style-sub {
  color: var(--text-secondary);
  font-size: 14px;
  font-style: italic;
}

.tags-container {
  margin: 20px 0;
}

.tag {
  display: inline-block;
  border: 1px solid #ccc;
  padding: 4px 12px;
  font-size: 12px;
  margin: 0 5px;
  color: #666;
  background: #fff;
}

.style-info-grid {
  display: flex;
  justify-content: center;
  gap: 60px;
  margin-top: 30px;
  border-top: 1px dashed #eee;
  padding-top: 30px;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-group .label {
  font-size: 11px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Physiognomy Grid */
.physio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.physio-item {
  background: #fffbf0;
  border: 1px solid #f3e5c2;
  padding: 15px;
  font-size: 13px;
  line-height: 1.7;
}

.physio-item strong {
  display: block;
  margin-bottom: 5px;
  color: #8d6e3f;
  font-size: 13px;
}

/* Feature Cards */
.features-list-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
}

.feature-card-simple {
  border: 1px solid #eee;
  padding: 25px;
  background: #fff;
  transition: all 0.3s;
}

.feature-card-simple:hover {
  border-color: var(--premium-gold);
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.03);
}

.feature-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  border-bottom: 1px solid #f5f5f5;
  padding-bottom: 12px;
}

.f-name { font-weight: bold; font-size: 16px; }
.f-type { font-size: 12px; color: #999; margin-left: auto; background: #f5f5f5; padding: 2px 8px; border-radius: 10px; }
.f-desc { font-size: 14px; color: #666; margin-bottom: 15px; line-height: 1.6; }
.f-advice { font-size: 12px; color: #8d6e3f; background: #fff9f0; padding: 10px; border-radius: 2px; }

/* Makeup & Occasion Lists */
.makeup-simple-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.makeup-row {
  display: flex;
  border-bottom: 1px solid #f5f5f5;
  padding-bottom: 15px;
  align-items: baseline;
}

.makeup-label {
  width: 70px;
  font-weight: bold;
  color: var(--text-primary);
  font-size: 15px;
}

.makeup-text {
  flex: 1;
  color: #555;
  font-size: 15px;
  line-height: 1.6;
}

.occasion-grid-retro {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 25px;
}

.occasion-card-retro {
  border: 1px solid #eee;
  padding: 25px;
  text-align: center;
  background: #fff;
  transition: all 0.3s;
}
.occasion-card-retro:hover {
  border-color: var(--premium-gold);
  box-shadow: 0 5px 15px rgba(0,0,0,0.02);
}

.occ-title {
  font-size: 16px;
  margin-bottom: 12px;
  color: var(--text-primary);
  font-weight: bold;
}

.occ-desc {
  font-size: 13px;
  color: #777;
  margin-bottom: 20px;
  min-height: 40px;
  line-height: 1.5;
}

.occ-items span {
  display: block;
  font-size: 13px;
  margin-bottom: 8px;
  color: #444;
}

/* Retro List */
.advice-list-retro {
  list-style: none;
  padding: 0;
  margin: 0;
}

.advice-list-retro li {
  padding: 15px 0;
  border-bottom: 1px dashed #eee;
  position: relative;
  padding-left: 25px;
  font-size: 15px;
  color: #444;
}

.advice-list-retro li::before {
  content: "✦";
  position: absolute;
  left: 0;
  color: var(--accent-gold);
  font-size: 14px;
  top: 17px;
}

/* Footer */
.footer-note {
  text-align: center;
  font-size: 12px;
  color: #ccc;
  margin-top: 60px;
  letter-spacing: 3px;
  text-transform: uppercase;
}

@media (max-width: 960px) {
  .main-frame-inner {
    padding: 32px;
  }

  .summary-text-box {
    min-width: 0;
  }

  .style-info-grid {
    gap: 30px;
  }
}

@media (max-width: 768px) {
  .face-analyzer-container {
    padding: 20px 12px;
  }

  .main-frame-outer {
    padding: 12px;
  }

  .main-frame-inner {
    padding: 24px;
  }

  .header h1 {
    font-size: 24px;
    letter-spacing: 3px;
  }

  .hero-section {
    flex-direction: column;
    gap: 20px;
  }

  .radar-chart-container {
    width: 220px;
    height: 220px;
  }

  .score-val {
    font-size: 30px;
  }

  .result-actions {
    flex-direction: column;
    gap: 12px;
  }

  .gender-options {
    flex-direction: column;
    gap: 12px;
  }

  .upload-box {
    padding: 40px 16px;
  }

  .btn-classic {
    padding: 10px 22px;
    font-size: 14px;
    margin: 4px 6px;
  }

  .section-block {
    padding: 18px;
  }

  .summary-text-box {
    width: 100%;
    min-width: 0;
  }


  .style-info-grid {
    flex-direction: column;
    gap: 18px;
  }

  .physio-grid,
  .features-list-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .header h1 {
    font-size: 20px;
    letter-spacing: 2px;
  }

  .welcome-text {
    font-size: 20px;
  }

  .summary-content {
    font-size: 13px;
    padding-left: 12px;
  }

  .block-title {
    font-size: 16px;
  }

  .score-val {
    font-size: 26px;
  }

  .radar-chart-container {
    width: 200px;
    height: 200px;
  }

  .score-display {
    left: 50%;
    top: 50%;
    width: 100%;
    transform: translate(-50%, -50%);
  }

  .science-block {
    padding: 18px 12px;
    text-align: left;
  }

  .science-content-premium {
    padding: 0;
    width: 100%;
    max-width: none;
    word-break: break-word;
    margin: 0 auto;
    text-align: left;
    box-sizing: border-box;
  }

  .science-body {
    padding: 0;
    font-size: 15px;
    line-height: 1.9;
    text-align: justify;
    box-sizing: border-box;
  }

  .science-conclusion {
    font-size: 14px;
  }

  .style-guide-grid {
    flex-direction: column;
    gap: 14px;
    align-items: stretch;
  }

  .guide-box {
    min-width: 0;
    padding: 10px 0;
    width: 100%;
    margin: 0 auto;
    max-width: none;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .hair-tag {
    font-size: 12px;
    margin: 4px;
  }

  .color-rec {
    font-size: 12px;
  }

  .color-group span:not(.c-label) {
    font-size: 12px;
    padding: 2px 6px;
  }
}

/* Element UI Overrides */
.custom-tabs :deep(.el-tabs__nav-wrap::after) {
  background-color: transparent;
}
.custom-tabs :deep(.el-tabs__item) {
  font-family: var(--font-serif);
  font-size: 16px;
  color: #999;
  transition: all 0.3s;
}
.custom-tabs :deep(.el-tabs__item.is-active) {
  color: var(--text-primary);
  font-weight: bold;
  font-size: 18px;
}
.custom-tabs :deep(.el-tabs__active-bar) {
  background-color: var(--text-primary);
  height: 1px;
}

.retro-collapse :deep(.el-collapse-item__header) {
  background: transparent;
  font-family: var(--font-serif);
  font-size: 16px;
  color: var(--text-primary);
  border-bottom: 1px solid #eee;
  height: 55px;
}
.retro-collapse :deep(.el-collapse-item__wrap) {
  background: transparent;
  border-bottom: none;
}

/* Premium Science Section */
.science-block {
  background: linear-gradient(135deg, #fffbf0 0%, #fff 100%);
  border: 1px solid rgba(207, 170, 110, 0.4);
  padding: 40px;
  margin-top: 60px;
  box-shadow: 0 10px 40px rgba(207, 170, 110, 0.1);
}
.block-title-premium {
  text-align: center;
  font-size: 20px;
  color: var(--premium-gold-dark);
  margin-bottom: 30px;
  font-family: var(--font-serif);
  letter-spacing: 4px;
}
.deco-l, .deco-r {
  color: var(--premium-gold);
  font-size: 18px;
  margin: 0 10px;
}
.science-content-premium {
  text-align: center;
  padding: 0 30px;
}
.science-intro {
  font-size: 14px;
  color: #888;
  margin-bottom: 25px;
  font-style: italic;
  font-family: 'Times New Roman', serif;
}
.science-body {
  font-size: 16px;
  line-height: 2;
  color: #444;
  margin-bottom: 25px;
  position: relative;
  padding: 0 20px;
}
.quote-mark-l, .quote-mark-r {
  font-size: 40px;
  color: rgba(207, 170, 110, 0.3);
  font-family: serif;
  vertical-align: sub;
}
.science-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: 25px 0;
  opacity: 0.4;
}
.science-divider .line {
  width: 50px;
  height: 1px;
  background: var(--premium-gold);
}
.science-divider .star {
  color: var(--premium-gold);
  font-size: 12px;
}
.science-conclusion {
  font-size: 16px;
  font-weight: bold;
  color: var(--premium-gold-dark);
  letter-spacing: 1px;
}

.star-legend {
  font-size: 12px;
  color: #888;
  margin: 8px auto 16px;
  text-align: center;
  line-height: 1.6;
}

.star-card {
  border: 1px solid rgba(0,0,0,0.05);
  box-shadow: 0 5px 15px rgba(0,0,0,0.03);
  border-radius: 4px;
}
.star-style {
  font-size: 12px;
  color: #666;
  margin-bottom: 6px;
}
.star-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

/* Updated Intl Cards */
.intl-card {
  border: none;
  background: #fcfcfc;
  box-shadow: inset 0 0 20px rgba(0,0,0,0.01);
  border-radius: 4px;
}
.intl-score {
  font-size: 28px;
  font-family: 'Times New Roman', serif;
  font-style: italic;
  color: #2c2c2c;
  margin-bottom: 5px;
}
.score-unit { font-size: 12px; }
.intl-desc { font-size: 12px; margin-bottom: 5px; }
.intl-tags span {
  display: inline-block;
  background: #f5f5f5;
  padding: 2px 6px;
  font-size: 10px;
  margin: 2px;
  border-radius: 2px;
  color: #666;
}

/* Dual Col */
.dual-col-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}
.sub-title {
  margin: 0 0 15px 0;
  font-size: 16px;
  border-bottom: 1px dashed #ccc;
  padding-bottom: 5px;
}
.info-row {
  margin-bottom: 8px;
  font-size: 14px;
}
.info-row .label {
  color: #999;
  margin-right: 5px;
}
.dot-list {
  list-style: none;
  padding: 0;
  margin: 10px 0;
}
.dot-list li {
  font-size: 13px;
  margin-bottom: 5px;
  padding-left: 15px;
  position: relative;
  color: #555;
}
.dot-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: #ccc;
}
.dot-list li.highlight {
  color: #8d6e3f;
}

/* Style Guide */
.style-guide-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
  justify-content: center;
  box-sizing: border-box;
}
.guide-box {
  flex: 1 1 280px;
  min-width: 280px;
  border: 1px solid #eee;
  padding: 20px;
  background: #fff;
  max-width: 360px;
  box-sizing: border-box;
}
.guide-title {
  margin: 0 0 15px 0;
  font-size: 15px;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 10px;
}
.tag-cloud {
  text-align: center;
}
.hair-tag {
  display: inline-block;
  border: 1px solid #ddd;
  padding: 5px 10px;
  margin: 5px;
  font-size: 13px;
  color: #666;
  background: #fafafa;
}
.color-rec {
  font-size: 13px;
}
.color-group { margin-bottom: 15px; line-height: 1.6; }
.color-group .c-label { font-weight: bold; margin-right: 5px; display: block; margin-bottom: 5px; }
.color-group span:not(.c-label) {
  margin-right: 8px;
  display: inline-block;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 4px;
}
.color-group.avoid { color: #999; }
</style>
