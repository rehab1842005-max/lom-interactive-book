const fs = require('fs');

const rawText = `## 📝 أسئلة كل جزئية

### 1 — ماذا يوجد حولنا؟

**صح أم غلط:**
كل ما يوجد حولنا في الطبيعة يعتبر كائنًا حيًا.
❌ غلط

**اختيار من متعدد:**
أي مجموعة تحتوي على كائنات حية؟
أ) الصخور والماء والهواء
ب) الإنسان والحيوان والنبات ✅
ج) الصخور والماء
د) الماء والهواء

---

### 2 — الإنسان من الكائنات الحية

**صح أم غلط:**
الإنسان من الكائنات الحية.
✅ صح

**اختيار من متعدد:**
أي مما يلي يُعد كائنًا حيًا؟
أ) صخرة
ب) ماء
ج) إنسان ✅
د) هواء

---

### 3 — الحيوانات كائنات حية

**صح أم غلط:**
الكلب والضفدع والفراشة من الكائنات الحية.
✅ صح

**اختيار من متعدد:**
أي مما يلي يُعد من الكائنات الحية؟
أ) الهواء
ب) الصخور
ج) الضفدع ✅
د) الماء

---

### 4 — النباتات كائنات حية

**صح أم غلط:**
النباتات من الأشياء غير الحية.
❌ غلط

**اختيار من متعدد:**
أي مما يلي يُعد كائنًا حيًا؟
أ) زهرة ✅
ب) صخرة
ج) ماء
د) هواء

---

### 5 — الأشياء غير الحية

**صح أم غلط:**
الصخور والماء والهواء من الأشياء غير الحية.
✅ صح

**اختيار من متعدد:**
أي مجموعة تمثل أشياء غير حية؟
أ) إنسان وحيوان ونبات
ب) نبات وحيوان وإنسان
ج) صخور وماء وهواء ✅
د) حيوان ونبات وإنسان

---

### 6 — الصخور

**صح أم غلط:**
الصخور من الكائنات الحية لأنها موجودة في الطبيعة.
❌ غلط

**اختيار من متعدد:**
لماذا تُعد الصخور من الأشياء غير الحية؟
أ) لأنها كبيرة
ب) لأنها لا تتغذى ولا تنمو ولا تتنفس ✅
ج) لأنها توجد في الجبال فقط
د) لأنها صلبة

---

### 7 — الماء

**صح أم غلط:**
الماء شيء غير حي رغم أنه يتحرك.
✅ صح

**اختيار من متعدد:**
أي مما يلي يُعد شيئًا غير حي؟
أ) قطة
ب) شجرة
ج) ماء ✅
د) إنسان

---

### 8 — الهواء

**صح أم غلط:**
نستطيع رؤية الهواء بأعيننا بسهولة.
❌ غلط

**اختيار من متعدد:**
كيف نشعر بوجود الهواء؟
أ) من خلال حركته وتأثيره في الأشياء ✅
ب) لأنه له لون
ج) لأنه كائن حي
د) لأنه ينمو

---

### 9 — خصائص الكائنات الحية

**صح أم غلط:**
من خصائص الكائنات الحية التغذية والنمو والتنفس.
✅ صح

**اختيار من متعدد:**
أي مما يلي من خصائص الكائنات الحية؟
أ) التغذية والنمو والتنفس ✅
ب) الصلابة واللون والحجم
ج) الماء والهواء والصخور
د) اللون والشكل والحجم

---

### 10 — التغذية

**صح أم غلط:**
تحتاج الكائنات الحية إلى الغذاء.
✅ صح

**اختيار من متعدد:**
أي مما يلي يُعد من خصائص الكائنات الحية؟
أ) التغذية ✅
ب) الصلابة
ج) اللون
د) اللمعان

---

### 11 — النمو

**صح أم غلط:**
الكائنات الحية يمكن أن تنمو مع مرور الوقت.
✅ صح

**اختيار من متعدد:**
ماذا يحدث للكائن الحي أثناء النمو؟
أ) يزداد في الحجم ويتطور مع الوقت ✅
ب) يتحول إلى صخرة
ج) يتوقف عن الحياة
د) يتحول إلى ماء

---

### 12 — التنفس

**صح أم غلط:**
التنفس من خصائص الكائنات الحية.
✅ صح

**اختيار من متعدد:**
أي مما يلي يُعد من خصائص الكائنات الحية؟
أ) التنفس ✅
ب) الصلابة
ج) اللون
د) اللمعان

---

### 13 — التعريف النهائي للكائنات الحية

**صح أم غلط:**
الكائنات الحية هي كل ما يتغذى وينمو ويتنفس.
✅ صح

**اختيار من متعدد:**
أي عبارة تشرح المقصود بالكائنات الحية؟
أ) كل ما يوجد في الطبيعة
ب) كل ما له لون وشكل
ج) كل ما يتغذى وينمو ويتنفس ✅
د) كل ما يتحرك فقط

---

# 📝 اختبار الصفحة كاملة

### صح أم غلط

**1.** الإنسان والحيوان والنبات من الكائنات الحية.
✅ صح

**2.** الصخور والماء والهواء من الأشياء غير الحية.
✅ صح

**3.** الكائنات الحية لا تحتاج إلى الغذاء.
❌ غلط

**4.** النمو من خصائص الكائنات الحية.
✅ صح

**5.** الهواء من الكائنات الحية.
❌ غلط

### اختيار من متعدد

**6.** أي مجموعة تمثل كائنات حية؟
أ) الصخور والماء والهواء
ب) الإنسان والحيوان والنبات ✅
ج) الماء والصخور
د) الهواء والماء

**7.** أي مما يلي شيء غير حي؟
أ) الإنسان
ب) النبات
ج) الحيوان
د) الصخرة ✅

**8.** أي مما يلي من خصائص الكائنات الحية؟
أ) اللون
ب) الصلابة
ج) النمو ✅
د) اللمعان

**9.** أي مما يلي يُعد كائنًا حيًا؟
أ) الهواء
ب) الماء
ج) زهرة ✅
د) صخرة

**10.** ما المقصود بالكائنات الحية؟
أ) كل الأشياء الموجودة في الطبيعة
ب) كل ما يتحرك فقط
ج) كل ما يتغذى وينمو ويتنفس ✅
د) كل الأشياء التي يمكن رؤيتها
`;

function parseText(text) {
  const normalizeDigits = (str) => {
    const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str.replace(/[٠-٩]/g, d => arabicNumbers.indexOf(d).toString());
  };

  const normalizedText = normalizeDigits(text);
  const lines = normalizedText.split('\n');
  let currentTarget = null;
  let currentZoneSeq = null;
  
  let pageQuestions = [];
  let zoneQuestionsMap = {};
  let allParsedQuestions = [];
  
  let currentQ = null;
  let currentMode = null;
  
  const saveCurrentQuestion = () => {
    if (currentQ && currentQ.title) {
      const finalQ = {
        id: Math.random().toString(36).substring(2, 10),
        type: currentQ.type || 'tf',
        title: currentQ.title,
        options: currentQ.options || (currentQ.type === 'tf' ? ['صح', 'خطأ'] : []),
        correctAnswer: currentQ.correctAnswer !== undefined ? currentQ.correctAnswer : (currentQ.type === 'tf' ? 'صح' : (currentQ.options?.[0] || '')),
        points: 1,
        maxAttempts: 2,
        showAnswer: true
      };
      
      allParsedQuestions.push(finalQ);
      
      if (currentTarget === 'page') {
        pageQuestions.push(finalQ);
      } else if (currentTarget === 'zone' && currentZoneSeq) {
        if (!zoneQuestionsMap[currentZoneSeq]) zoneQuestionsMap[currentZoneSeq] = [];
        zoneQuestionsMap[currentZoneSeq].push(finalQ);
      } else {
        pageQuestions.push(finalQ);
      }
    }
    currentQ = null;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;

    if (line.includes('اختبار الصفحة') || line.includes('اختبار شامل') || line.includes('اختبار الدرس')) {
      saveCurrentQuestion();
      currentTarget = 'page';
      continue;
    }
    
    if (/^[\-\*]{3,}$/.test(line)) {
      continue;
    }
    
    const isExplicitZoneHeader = line.includes('المقطع') || line.includes('مقطع') || line.includes('المربع') || line.includes('مربع') || (line.startsWith('#') && !line.includes('اختبار') && !line.includes('أسئلة'));
    
    if (currentTarget !== 'page' && (isExplicitZoneHeader || line.startsWith('###') || line.startsWith('##'))) {
      const arabicWordMap = { 'الأول': '1', 'الاول': '1', 'الثاني': '2', 'الثالث': '3', 'الرابع': '4', 'الخامس': '5', 'السادس': '6', 'السابع': '7', 'الثامن': '8', 'التاسع': '9', 'العاشر': '10' };
      let matchedSeq = null;
      
      const zoneMatch = line.match(/(?:###|##|#|\*{1,2})?\s*(?:المقطع|مقطع|المربع|مربع|المنطقة|منطقة|س|فقرة)?\s*(\d+)\s*(?:[—\-:\.\)]|\*{1,2}|$)/i);
      if (zoneMatch) {
        matchedSeq = zoneMatch[1];
      } else {
        for (const [word, num] of Object.entries(arabicWordMap)) {
          if (line.includes(word)) {
            matchedSeq = num;
            break;
          }
        }
      }

      if (matchedSeq && !line.startsWith('✅') && !line.startsWith('❌') && !line.match(/^[أ-يa-d][\.\)]/)) {
        saveCurrentQuestion();
        currentTarget = 'zone';
        currentZoneSeq = matchedSeq;
        continue;
      }
    }
    
    if (line.includes('صح أم غلط') || line.includes('صح ام غلط') || line.includes('صح و خطأ') || line.includes('صح أو خطأ') || line.includes('صح أم خطأ')) {
      saveCurrentQuestion();
      currentMode = 'tf';
      continue;
    }
    
    if (line.includes('اختيار من متعدد') || line.includes('اختر الإجابة') || line.includes('اختر الاجابه') || line.includes('اختيار من المتعدد')) {
      saveCurrentQuestion();
      currentMode = 'mcq';
      continue;
    }
    
    const isMcqOption = !!line.match(/^[أ-يa-d][\.\)]/) || !!line.match(/^[\-\*]\s*[أ-يa-d]/) || !!line.match(/^\d+[\.\)]\s*[أ-يa-d]/);
    const isTfAnswer = line.includes('✅') || line.includes('❌') || line === 'صح' || line === 'خطأ' || line === 'غلط' || line === 'صواب';
    
    if (!isMcqOption && !isTfAnswer) {
      saveCurrentQuestion();
      if (!currentMode) {
        currentMode = 'tf';
      }
      if (currentMode) {
        let cleanTitle = line.replace(/^\*\*?\d+\.?\*\*?\s*/, '').replace(/\*+/g, '').trim();
        cleanTitle = cleanTitle.replace(/^(?:س\s*\d+|\d+)[\.\-:\)]\s*/, '').trim();
        
        if (cleanTitle) {
          currentQ = {
            type: currentMode,
            title: cleanTitle,
            options: currentMode === 'tf' ? ['صح', 'خطأ'] : []
          };
        }
      }
    } else if (currentQ) {
      if (currentQ.type === 'tf') {
        if (line.includes('✅ صح') || line.includes('صح ✅') || line === 'صح' || (line.includes('✅') && !line.includes('غلط') && !line.includes('خطأ'))) {
          currentQ.correctAnswer = 'صح';
        } else if (line.includes('❌ غلط') || line.includes('غلط ❌') || line.includes('خطأ') || line === 'غلط' || line.includes('❌')) {
          currentQ.correctAnswer = 'خطأ';
        }
      } else if (currentQ.type === 'mcq') {
        const isCorrect = line.includes('✅');
        const cleanOption = line.replace(/^[أ-يa-d\d][\.\)]/, '').replace('✅', '').replace(/\*+/g, '').trim();
        if (cleanOption) {
          currentQ.options = [...(currentQ.options || []), cleanOption];
          if (isCorrect) {
            currentQ.correctAnswer = cleanOption;
          }
        }
      }
    }
  }
  saveCurrentQuestion();

  return { zoneQuestionsMap, pageQuestions, allParsedQuestions };
}

const result = parseText(rawText);
console.log("Zone mappings found:", Object.keys(result.zoneQuestionsMap));
for (const [k, v] of Object.entries(result.zoneQuestionsMap)) {
  console.log(`Zone ${k} has ${v.length} questions:`, v.map(q => q.title));
}
console.log(`Page questions count: ${result.pageQuestions.length}`);
console.log("Page questions:", result.pageQuestions.map(q => q.title));
