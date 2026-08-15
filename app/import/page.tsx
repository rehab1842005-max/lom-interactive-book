"use client";
import { useBookStore, saveCurrentStoreToDb } from "../store/bookStore";
import { useState } from "react";

export default function ImportPage() {
  const [status, setStatus] = useState("");

  const handleImport = async () => {
    setStatus("جاري الاستيراد...");
    try {
      const { pages, zones, updateMultipleZones, updatePage } = useBookStore.getState();
      
      // We assume Lesson 1, Page 1
      const lesson1Pages = pages.filter(p => p.lessonId === "lesson1" || p.lessonId === "1" || pages.indexOf(p) === 0);
      const targetPageId = lesson1Pages.length > 0 ? lesson1Pages[0].id : pages[0]?.id;
      
      if (!targetPageId) {
        setStatus("لم يتم العثور على أي صفحة!");
        return;
      }

      // Hardcoded parsed questions for rehab
      const zonesData = {
        "1": [
          { id: "q1_1", type: "tf", title: "كل ما يوجد حولنا في الطبيعة يعتبر كائنًا حيًا.", correctAnswer: "خطأ", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q1_2", type: "mcq", title: "أي مجموعة تحتوي على كائنات حية؟", correctAnswer: "الإنسان والحيوان والنبات", options: ["الصخور والماء والهواء", "الإنسان والحيوان والنبات", "الصخور والماء", "الماء والهواء"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "2": [
          { id: "q2_1", type: "tf", title: "الإنسان من الكائنات الحية.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q2_2", type: "mcq", title: "أي مما يلي يُعد كائنًا حيًا؟", correctAnswer: "إنسان", options: ["صخرة", "ماء", "إنسان", "هواء"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "3": [
          { id: "q3_1", type: "tf", title: "الكلب والضفدع والفراشة من الكائنات الحية.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q3_2", type: "mcq", title: "أي مما يلي يُعد من الكائنات الحية؟", correctAnswer: "الضفدع", options: ["الهواء", "الصخور", "الضفدع", "الماء"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "4": [
          { id: "q4_1", type: "tf", title: "النباتات من الأشياء غير الحية.", correctAnswer: "خطأ", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q4_2", type: "mcq", title: "أي مما يلي يُعد كائنًا حيًا؟", correctAnswer: "زهرة", options: ["زهرة", "صخرة", "ماء", "هواء"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "5": [
          { id: "q5_1", type: "tf", title: "الصخور والماء والهواء من الأشياء غير الحية.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q5_2", type: "mcq", title: "أي مجموعة تمثل أشياء غير حية؟", correctAnswer: "صخور وماء وهواء", options: ["إنسان وحيوان ونبات", "نبات وحيوان وإنسان", "صخور وماء وهواء", "حيوان ونبات وإنسان"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "6": [
          { id: "q6_1", type: "tf", title: "الصخور من الكائنات الحية لأنها موجودة في الطبيعة.", correctAnswer: "خطأ", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q6_2", type: "mcq", title: "لماذا تُعد الصخور من الأشياء غير الحية؟", correctAnswer: "لأنها لا تتغذى ولا تنمو ولا تتنفس", options: ["لأنها كبيرة", "لأنها لا تتغذى ولا تنمو ولا تتنفس", "لأنها توجد في الجبال فقط", "لأنها صلبة"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "7": [
          { id: "q7_1", type: "tf", title: "الماء شيء غير حي رغم أنه يتحرك.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q7_2", type: "mcq", title: "أي مما يلي يُعد شيئًا غير حي؟", correctAnswer: "ماء", options: ["قطة", "شجرة", "ماء", "إنسان"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "8": [
          { id: "q8_1", type: "tf", title: "نستطيع رؤية الهواء بأعيننا بسهولة.", correctAnswer: "خطأ", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q8_2", type: "mcq", title: "كيف نشعر بوجود الهواء؟", correctAnswer: "من خلال حركته وتأثيره في الأشياء", options: ["من خلال حركته وتأثيره في الأشياء", "لأنه له لون", "لأنه كائن حي", "لأنه ينمو"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "9": [
          { id: "q9_1", type: "tf", title: "من خصائص الكائنات الحية التغذية والنمو والتنفس.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q9_2", type: "mcq", title: "أي مما يلي من خصائص الكائنات الحية؟", correctAnswer: "التغذية والنمو والتنفس", options: ["التغذية والنمو والتنفس", "الصلابة واللون والحجم", "الماء والهواء والصخور", "اللون والشكل والحجم"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "10": [
          { id: "q10_1", type: "tf", title: "تحتاج الكائنات الحية إلى الغذاء.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q10_2", type: "mcq", title: "أي مما يلي يُعد من خصائص الكائنات الحية؟", correctAnswer: "التغذية", options: ["التغذية", "الصلابة", "اللون", "اللمعان"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "11": [
          { id: "q11_1", type: "tf", title: "الكائنات الحية يمكن أن تنمو مع مرور الوقت.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q11_2", type: "mcq", title: "ماذا يحدث للكائن الحي أثناء النمو؟", correctAnswer: "يزداد في الحجم ويتطور مع الوقت", options: ["يزداد في الحجم ويتطور مع الوقت", "يتحول إلى صخرة", "يتوقف عن الحياة", "يتحول إلى ماء"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "12": [
          { id: "q12_1", type: "tf", title: "التنفس من خصائص الكائنات الحية.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q12_2", type: "mcq", title: "أي مما يلي يُعد من خصائص الكائنات الحية؟", correctAnswer: "التنفس", options: ["التنفس", "الصلابة", "اللون", "اللمعان"], points: 1, showAnswer: true, maxAttempts: 2 }
        ],
        "13": [
          { id: "q13_1", type: "tf", title: "الكائنات الحية هي كل ما يتغذى وينمو ويتنفس.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
          { id: "q13_2", type: "mcq", title: "أي عبارة تشرح المقصود بالكائنات الحية؟", correctAnswer: "كل ما يتغذى وينمو ويتنفس", options: ["كل ما يوجد في الطبيعة", "كل ما له لون وشكل", "كل ما يتغذى وينمو ويتنفس", "كل ما يتحرك فقط"], points: 1, showAnswer: true, maxAttempts: 2 }
        ]
      };

      const pageQuestions = [
        { id: "pq1", type: "tf", title: "الإنسان والحيوان والنبات من الكائنات الحية.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
        { id: "pq2", type: "tf", title: "الصخور والماء والهواء من الأشياء غير الحية.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
        { id: "pq3", type: "tf", title: "الكائنات الحية لا تحتاج إلى الغذاء.", correctAnswer: "خطأ", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
        { id: "pq4", type: "tf", title: "النمو من خصائص الكائنات الحية.", correctAnswer: "صح", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
        { id: "pq5", type: "tf", title: "الهواء من الكائنات الحية.", correctAnswer: "خطأ", options: ["صح", "خطأ"], points: 1, showAnswer: true, maxAttempts: 2 },
        { id: "pq6", type: "mcq", title: "أي مجموعة تمثل كائنات حية؟", correctAnswer: "الإنسان والحيوان والنبات", options: ["الصخور والماء والهواء", "الإنسان والحيوان والنبات", "الماء والصخور", "الهواء والماء"], points: 1, showAnswer: true, maxAttempts: 2 },
        { id: "pq7", type: "mcq", title: "أي مما يلي شيء غير حي؟", correctAnswer: "الصخرة", options: ["الإنسان", "النبات", "الحيوان", "الصخرة"], points: 1, showAnswer: true, maxAttempts: 2 },
        { id: "pq8", type: "mcq", title: "أي مما يلي من خصائص الكائنات الحية؟", correctAnswer: "النمو", options: ["اللون", "الصلابة", "النمو", "اللمعان"], points: 1, showAnswer: true, maxAttempts: 2 },
        { id: "pq9", type: "mcq", title: "أي مما يلي يُعد كائنًا حيًا؟", correctAnswer: "زهرة", options: ["الهواء", "الماء", "زهرة", "صخرة"], points: 1, showAnswer: true, maxAttempts: 2 },
        { id: "pq10", type: "mcq", title: "ما المقصود بالكائنات الحية؟", correctAnswer: "كل ما يتغذى وينمو ويتنفس", options: ["كل الأشياء الموجودة في الطبيعة", "كل ما يتحرك فقط", "كل ما يتغذى وينمو ويتنفس", "كل الأشياء التي يمكن رؤيتها"], points: 1, showAnswer: true, maxAttempts: 2 }
      ];

      const pageZones = zones.filter(z => z.pageId === targetPageId);
      const visualZones = [...pageZones].sort((a, b) => Math.abs(a.y - b.y) > 25 ? a.y - b.y : b.x - a.x);
      
      let appliedZones = 0;
      const zoneUpdates = [];

      for (const [seq, qs] of Object.entries(zonesData)) {
        const targetSeqNum = parseInt(seq, 10);
        let targetZone = pageZones.find(z => {
          const num = z.name?.match(/\d+/);
          return num && parseInt(num[0], 10) === targetSeqNum;
        });
        
        if (!targetZone && visualZones[targetSeqNum - 1]) {
          targetZone = visualZones[targetSeqNum - 1];
        }
        
        if (targetZone) {
          const interactions = new Set(targetZone.interactionTypes || (targetZone.interactionType !== 'none' ? [targetZone.interactionType] : []));
          interactions.add('question');
          
          zoneUpdates.push({
            id: targetZone.id,
            updates: { 
              name: `${targetSeqNum}`,
              interactionTypes: Array.from(interactions),
              content: {
                ...targetZone.content,
                questions: qs,
                question: undefined
              }
            }
          });
          appliedZones++;
        }
      }
      
      if (zoneUpdates.length > 0) {
        updateMultipleZones(zoneUpdates as any);
      }

      updatePage(targetPageId, { questions: pageQuestions as any });
      await saveCurrentStoreToDb();
      
      setStatus(`✅ تم بنجاح! تم وضع أسئلة في ${appliedZones} مربعات، ووضع أسئلة الصفحة كاملة (${pageQuestions.length} سؤال). يمكنك العودة للصفحة الرئيسية الآن ورؤيتها.`);
    } catch (e: any) {
      console.error(e);
      setStatus("حدث خطأ: " + e.message);
    }
  };

  return (
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif", direction: "rtl" }}>
      <h1 style={{ color: "#d946ef" }}>مرحباً مس رحاب! 👋</h1>
      <p style={{ fontSize: "20px" }}>لقد قمت بتجهيز أسئلتك للدرس الأول (تعريف الكائنات الحية 13 مقطع). اضغطي على الزر بالأسفل ليتم إضافتها فوراً!</p>
      
      <button 
        onClick={handleImport}
        style={{ padding: "15px 30px", fontSize: "22px", background: "#d946ef", color: "white", border: "none", borderRadius: "10px", cursor: "pointer", marginTop: "20px", fontWeight: "bold" }}
      >
        🚀 أضف أسئلتي الآن!
      </button>
      
      {status && (
        <div style={{ marginTop: "30px", fontSize: "24px", color: status.includes("نجاح") ? "green" : "red", fontWeight: "bold" }}>
          {status}
        </div>
      )}

      <div style={{ marginTop: "40px" }}>
        <a href="/" style={{ color: "blue", textDecoration: "underline", fontSize: "18px" }}>العودة للصفحة الرئيسية بعد الإضافة</a>
      </div>
    </div>
  );
}
