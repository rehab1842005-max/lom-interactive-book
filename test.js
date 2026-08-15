const text = `
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

# 📝 اختبار الصفحة كاملة

### صح أم غلط

**1.** الإنسان والحيوان والنبات من الكائنات الحية.
✅ صح

**2.** الصخور والماء والهواء من الأشياء غير الحية.
✅ صح
`;

      const lines = text.split('\n');
      let currentTarget = null;
      let currentZoneSeq = null;
      
      let pageQuestions = [];
      let zoneQuestionsMap = {};
      
      let currentQ = null;
      let currentMode = null;
      
      const saveCurrentQuestion = () => {
        if (currentQ && currentQ.title) {
          currentQ.id = Math.random().toString();
          currentQ.points = 1;
          currentQ.maxAttempts = 2;
          currentQ.showAnswer = true;
          
          if (currentTarget === 'page') {
            pageQuestions.push(currentQ);
          } else if (currentTarget === 'zone' && currentZoneSeq) {
            if (!zoneQuestionsMap[currentZoneSeq]) zoneQuestionsMap[currentZoneSeq] = [];
            zoneQuestionsMap[currentZoneSeq].push(currentQ);
          }
        }
        currentQ = null;
      };

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;

        // 1. Check for targets
        if (line.includes('اختبار الصفحة كاملة')) {
          saveCurrentQuestion();
          currentTarget = 'page';
          continue;
        }
        
        const zoneMatch = line.match(/^(?:###\s*)?(\d+)\s*[—\-]/);
        if (zoneMatch) {
          saveCurrentQuestion();
          currentTarget = 'zone';
          currentZoneSeq = zoneMatch[1];
          continue;
        }
        
        // 2. Check for mode switches
        if (line.includes('صح أم غلط') || line.includes('صح ام غلط') || line.includes('صح و خطأ')) {
          saveCurrentQuestion();
          currentMode = 'tf';
          continue;
        }
        
        if (line.includes('اختيار من متعدد')) {
          saveCurrentQuestion();
          currentMode = 'mcq';
          continue;
        }
        
        // 3. Process line based on whether it's an answer option or a new question title
        const isMcqOption = !!line.match(/^[أ-يa-d][\.\)]/);
        const isTfAnswer = line.includes('✅') || line.includes('❌') || line === 'صح' || line === 'خطأ' || line === 'غلط';
        
        if (!isMcqOption && !isTfAnswer) {
          // This must be a new question title!
          saveCurrentQuestion();
          if (currentMode) {
            // Clean up Markdown bold and leading numbers if any
            let cleanTitle = line.replace(/^\*\*?\d+\.?\*\*?\s*/, '').replace(/\*+/g, '').trim();
            // Also clean up formats like "1. " or "1- "
            cleanTitle = cleanTitle.replace(/^\d+[\.\-\)]\s*/, '').trim();
            
            currentQ = {
              type: currentMode,
              title: cleanTitle,
              options: currentMode === 'tf' ? ['صح', 'خطأ'] : []
            };
          }
        } else if (currentQ) {
          // This is an answer to the current question
          if (currentQ.type === 'tf') {
            if (line.includes('✅ صح') || line.includes('صح ✅') || line === 'صح' || (line.includes('✅') && !line.includes('غلط') && !line.includes('خطأ'))) {
              currentQ.correctAnswer = 'صح';
            } else if (line.includes('❌ غلط') || line.includes('غلط ❌') || line.includes('خطأ') || line === 'غلط' || line.includes('❌')) {
              currentQ.correctAnswer = 'خطأ';
            }
          } else if (currentQ.type === 'mcq') {
            const isCorrect = line.includes('✅');
            const cleanOption = line.replace(/^[أ-يa-d][\.\)]/, '').replace('✅', '').replace(/\*+/g, '').trim();
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
      
      console.log("Zones:", JSON.stringify(zoneQuestionsMap, null, 2));
      console.log("Page:", JSON.stringify(pageQuestions, null, 2));
