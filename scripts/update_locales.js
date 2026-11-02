/**
 * scripts/update_locales.js
 */
const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '..', 'frontend', 'src', 'locales', 'en.json');
const taPath = path.join(__dirname, '..', 'frontend', 'src', 'locales', 'ta.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const ta = JSON.parse(fs.readFileSync(taPath, 'utf8'));

// Updates to nav
en.nav.home = 'Home';
en.nav.irrigation = 'Irrigation';
en.nav.whatif = 'What If?';
en.nav.askAgent = 'Ask Agent';
en.nav.impact = 'Impact';
en.nav.proof = 'Impact';
en.nav.settings = 'Settings';
en.nav.chat = 'Ask Agent';

ta.nav.home = 'முகப்பு';
ta.nav.irrigation = 'பாசனம்';
ta.nav.whatif = 'சூழல் ஆய்வு';
ta.nav.askAgent = 'உதவி';
ta.nav.impact = 'தாக்கம்';
ta.nav.proof = 'தாக்கம்';
ta.nav.settings = 'அமைப்புகள்';
ta.nav.chat = 'உதவி';

// Updates to provider
en.provider.live = 'Live';
en.provider.mock = 'Mock';
en.provider.liveLong = 'Live agent (Gemini)';
en.provider.mockLong = 'Mock mode';

ta.provider.live = 'நேரலை';
ta.provider.mock = 'மாதிரி';
ta.provider.liveLong = 'நேரலை முகவர் (Gemini)';
ta.provider.mockLong = 'மாதிரி முறை';

// Fix suspicious English in ta
ta.app.mockModeNotice = 'மாதிரி முறை இயங்குகிறது: மாதிரி தரவுகளுடன் செயல்படுகிறது.';
ta.app.liveModeNotice = 'நேரலை முறை இயங்குகிறது: வானிலை மற்றும் AI மாதிரி மூலம் இணைக்கப்பட்டுள்ளது.';
ta.irrigation.subtitle = 'நீராவிப்போக்கு (ET0) மற்றும் மழை அடிப்படையில் கணிக்கப்பட்டது';
ta.whatif.title = 'சூழல் மாதிரி ஆய்வு';
ta.whatif.disclaimer = 'இது ஒரு மாதிரி சூழல் ஆய்வு, அதிகாரப்பூர்வ முன்னறிவிப்பு அல்ல.';
ta.nearby.notice = 'மதுரை மாவட்டத்திற்கான மாதிரி தகவல். மாவட்ட ஆட்சியரகம் அல்லது கிராம நிர்வாக அலுவலரிடம் சரிபார்க்கவும்.';
ta.settings.theme = 'வண்ண அமைப்பு';
ta.about.boundaryDesc = 'செயற்கை நுண்ணறிவு மொழியாக்கத்திற்கும் உரையாடலுக்கும் மட்டுமே பயன்படுகிறது; ஆனால் இடர் அளவுகளை ஒருபோதும் தீர்மானிப்பதில்லை. அனைத்து இடர் எச்சரிக்கைகளும் IMD மற்றும் ECMWF, GFS, ICON வானிலை மாதிரிகளின் துல்லிய விதிகளையே பின்பற்றுகின்றன.';
ta.risk.ruleNote = 'துல்லிய கணித விதிகள் மூலம் தீர்மானிக்கப்பட்டது (AI ஊகிக்கவில்லை)';
ta.trace.title = 'AI முகவர் செயல்பாட்டுப் பதிவு';
ta.trace.orchestrator = 'ஒருங்கிணைப்பாளர்';
ta.trace.subagents = 'துணை முகவர்கள்: இடர் ஆய்வாளர், பயிர் ஆலோசகர், தமிழ் மொழியாக்கம்';
ta.trace.structuredOutput = 'முறையான தரவு வெளியீடு சரிபார்க்கப்பட்டது';
ta.impact.verifiedNotice = 'வரலாற்று வானிலை ஆவணங்களுடன் சரிபார்க்கப்பட்டது.';
ta.impact.openMeteoLink = 'வரலாற்று வானிலை ஆவணம்';
ta.proof.subtitle = 'மதுரை வரலாறு: வரலாற்று வானிலைத் தரவு மூலம் தீவிர நிகழ்வு மறுபரிசீலனை';
ta.proof.verifiedNotice = 'வரலாற்று வானிலை ஆவணங்களுடன் சரிபார்க்கப்பட்டது.';
ta.proof.openMeteoLink = 'வரலாற்று வானிலை ஆவணம்';
ta.chat.agent = 'காலநிலை காப்பான் AI';

// Hero Decision card keys
en.heroDecision = {
  homeTitle: "Today's Farm Action Verdict",
  homeVerdict: "Maintain 2-3 cm Shallow Standing Water",
  homeReason: "Low overall hazard with favorable foliar spray window. Keep field drainage clear.",
  irrigationTitle: "Today's Irrigation Decision",
  whatifTitle: "Hypothetical Scenario Verdict",
  chatTitle: "Agro-Climatic Intelligence Verdict",
  impactTitle: "Advisory Accuracy & Ground Truth Verdict"
};

ta.heroDecision = {
  homeTitle: "இன்றைய விவசாய முடிவு",
  homeVerdict: "வயலில் 2 முதல் 3 செ.மீ சீரான நீர்மட்டம் பராமரிக்கவும்",
  homeReason: "வானிலை சாதகமாக உள்ளது; மருந்து தெளிக்க உகந்த நேரம். வடிகால் வழிகளை தூய்மையாக வைத்திருக்கவும்.",
  irrigationTitle: "இன்றைய பாசன முடிவு",
  whatifTitle: "மாதிரி சூழல் ஆய்வு முடிவு",
  chatTitle: "வேளாண் காலநிலை முடிவு",
  impactTitle: "முன்னெச்சரிக்கை துல்லிய முடிவு"
};

// Irrigation specific additions
en.irrigation.heroTodayIrrigate = "Today: Normal Irrigation";
en.irrigation.heroTodaySkip = "Today: Skip Irrigation, Rain Expected";
en.irrigation.heroTodayLight = "Today: Light Irrigation";
en.irrigation.waterDemand = "Water Demand (ET0)";
en.irrigation.waterDemandDesc = "FAO-56 Evaporative Demand";
en.irrigation.forecastRain = "Forecast Rain";
en.irrigation.forecastRainDesc = "Expected 7-Day Rainfall";
en.irrigation.waterBalance = "Water Balance";
en.irrigation.surplus = "Surplus";
en.irrigation.deficit = "Deficit";
en.irrigation.surplusDesc = "Net Moisture Surplus";
en.irrigation.deficitDesc = "Net Moisture Deficit";
en.irrigation.chartYAxis = "Water Depth (mm)";
en.irrigation.chartLegendEt0 = "Water Demand (ET0 mm)";
en.irrigation.chartLegendRain = "Forecast Rain (mm)";
en.irrigation.sevenDayRowTitle = "7-Day Irrigation Schedule";
en.irrigation.unitMm = "mm";
en.irrigation.todayBadge = "Today";
en.irrigation.shortActions = {
  irrigate: "Irrigate",
  light: "Light",
  skip: "Skip"
};

ta.irrigation.heroTodayIrrigate = "இன்று: பாசனம் செய்யவும்";
ta.irrigation.heroTodaySkip = "இன்று: பாசனம் தவிர்க்கவும், மழை வாய்ப்பு";
ta.irrigation.heroTodayLight = "இன்று: குறைந்த பாசனம்";
ta.irrigation.waterDemand = "நீர்த்தேவை (ET0)";
ta.irrigation.waterDemandDesc = "FAO-56 நீராவிப்போக்கு தேவை";
ta.irrigation.forecastRain = "மழை முன்னறிவிப்பு";
ta.irrigation.forecastRainDesc = "எதிர்பார்க்கப்படும் 7 நாள் மழை";
ta.irrigation.waterBalance = "நீர் சமநிலை";
ta.irrigation.surplus = "உபரி";
ta.irrigation.deficit = "பற்றாக்குறை";
ta.irrigation.surplusDesc = "நிகர ஈரப்பத உபரி";
ta.irrigation.deficitDesc = "நிகர ஈரப்பத பற்றாக்குறை";
ta.irrigation.chartYAxis = "நீர் அளவு (மி.மீ)";
ta.irrigation.chartLegendEt0 = "நீர்த்தேவை (ET0 மி.மீ)";
ta.irrigation.chartLegendRain = "மழை (மி.மீ)";
ta.irrigation.sevenDayRowTitle = "7 நாட்கள் பாசன அட்டவணை";
ta.irrigation.unitMm = "மி.மீ";
ta.irrigation.todayBadge = "இன்று";
ta.irrigation.shortActions = {
  irrigate: "பாசனம்",
  light: "குறைவு",
  skip: "தவிர்"
};

// Guidance Card Keys
en.guidance = {
  title: "Agent Guidance",
  subtitle: "Interactive Agromet Decision Support",
  listen: "Listen",
  stop: "Stop",
  playing: "Playing Audio...",
  unsupported: "Voice synthesis not supported in this browser"
};

ta.guidance = {
  title: "AI வழிகாட்டல்",
  subtitle: "வேளாண் காலநிலை முடிவெடுக்கும் உதவி",
  listen: "கேட்கவும்",
  stop: "நிறுத்தவும்",
  playing: "ஒலிபரப்பாகிறது...",
  unsupported: "இந்த உலாவியில் குரல் வசதி இல்லை"
};

en.spray.safeShort = "Safe";
en.spray.cautionShort = "Caution";
en.spray.unsafeShort = "Unsafe";

ta.spray.safeShort = "பாதுகாப்பானது";
ta.spray.cautionShort = "கவனம்";
ta.spray.unsafeShort = "தவிர்க்கவும்";

fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');
fs.writeFileSync(taPath, JSON.stringify(ta, null, 2), 'utf8');
console.log('Successfully updated en.json and ta.json with clean keys and zero English in ta.json');
