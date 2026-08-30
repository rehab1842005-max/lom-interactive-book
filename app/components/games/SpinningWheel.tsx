"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { playSuccessSound } from '@/app/utils/audio';

type StudentGroup = {
  id: string;
  name: string;
  names: string[];
  password?: string;
};

export default function SpinningWheel() {
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [names, setNames] = useState<string[]>([]);
  
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNamesText, setEditNamesText] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const colors = [
    '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#4ade80', 
    '#34d399', '#2dd4bf', '#38bdf8', '#60a5fa', '#818cf8', 
    '#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'
  ];

  // Load groups on mount
  useEffect(() => {
    const saved = localStorage.getItem('wheel_groups');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
          setSelectedGroupIds([parsed[0].id]); // select first group by default
        }
      } catch (e) {}
    } else {
      // Default initial state
      const defaultGroup = {
        id: 'default_1',
        name: 'المجموعة 1',
        names: ['أحمد', 'محمد', 'عمر', 'علي', 'فاطمة', 'مريم']
      };
      setGroups([defaultGroup]);
      setSelectedGroupIds([defaultGroup.id]);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (groups.length > 0) {
      localStorage.setItem('wheel_groups', JSON.stringify(groups));
    }
  }, [groups]);

  // Update active names based on selected groups
  useEffect(() => {
    let combined: string[] = [];
    groups.filter(g => selectedGroupIds.includes(g.id)).forEach(g => {
      combined = [...combined, ...g.names];
    });
    setNames(Array.from(new Set(combined))); // unique names
    setWinner(null);
    setRotation(0);
  }, [groups, selectedGroupIds]);

  const handleCreateGroup = () => {
    setEditName('');
    setEditNamesText('');
    setEditPassword('');
    setEditingGroupId('new');
  };

  const handleEditGroup = (g: StudentGroup) => {
    if (g.password) {
      const entered = prompt('الرجاء إدخال الرقم السري لهذه المجموعة:');
      if (entered !== g.password) {
        alert('الرقم السري غير صحيح!');
        return;
      }
    }
    setEditName(g.name);
    setEditNamesText(g.names.join('\n'));
    setEditPassword(g.password || '');
    setEditingGroupId(g.id);
  };

  const handleDeleteGroup = (g: StudentGroup) => {
    if (g.password) {
      const entered = prompt('الرجاء إدخال الرقم السري لهذه المجموعة لحذفها:');
      if (entered !== g.password) {
        alert('الرقم السري غير صحيح!');
        return;
      }
    }
    if (confirm('هل أنت متأكد من حذف هذه المجموعة؟')) {
      setGroups(groups.filter(group => group.id !== g.id));
      setSelectedGroupIds(selectedGroupIds.filter(gid => gid !== g.id));
    }
  };

  const handleSaveGroup = () => {
    if (!editName.trim()) {
      alert("الرجاء إدخال اسم المجموعة");
      return;
    }
    const parsedNames = editNamesText.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (parsedNames.length < 2) {
      alert("الرجاء إدخال اسمين على الأقل");
      return;
    }

    if (editingGroupId === 'new') {
      const newGroup = { id: Date.now().toString(), name: editName, names: parsedNames, password: editPassword.trim() };
      setGroups([...groups, newGroup]);
      if (selectedGroupIds.length === 0) setSelectedGroupIds([newGroup.id]);
    } else {
      setGroups(groups.map(g => g.id === editingGroupId ? { ...g, name: editName, names: parsedNames, password: editPassword.trim() } : g));
    }
    setEditingGroupId(null);
  };

  const spinWheel = () => {
    if (names.length < 2 || isSpinning) {
      if (names.length < 2) alert("يجب اختيار مجموعة تحتوي على اسمين على الأقل");
      return;
    }
    
    setIsSpinning(true);
    setWinner(null);

    const sliceDegree = 360 / names.length;
    const randomNameIndex = Math.floor(Math.random() * names.length);
    
    const spins = 5 * 360; 
    const currentFullSpins = Math.floor(rotation / 360) * 360;
    const finalRotation = currentFullSpins + spins + (360 - (randomNameIndex * sliceDegree + (sliceDegree / 2)));

    setRotation(finalRotation);

    const playWheelTicks = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const audioCtx = new AudioContext();
        
        let tickCount = 45;
        let timeNow = audioCtx.currentTime;
        let interval = 0.02; 
        
        for(let i=0; i<tickCount; i++) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(1000 - (i * 10), timeNow);
          
          gain.gain.setValueAtTime(0, timeNow);
          gain.gain.linearRampToValueAtTime(0.2, timeNow + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, timeNow + 0.05);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(timeNow);
          osc.stop(timeNow + 0.06);
          
          interval *= 1.07; 
          timeNow += interval;
        }
      } catch(e) {}
    };

    playWheelTicks();

    setTimeout(() => {
      setIsSpinning(false);
      setWinner(names[randomNameIndex]);
      
      playSuccessSound();
      
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }, 4000); 
  };

  const sliceDegree = names.length > 0 ? (360 / names.length) : 0;
  const conicString = names.map((_, i) => `${colors[i % colors.length]} ${i * sliceDegree}deg ${(i + 1) * sliceDegree}deg`).join(', ');

  return (
    <div style={{ background: 'white', borderRadius: '24px', padding: '40px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', display: 'flex', gap: '40px', flexWrap: 'wrap', marginTop: '60px' }}>
      
      {/* Settings / Groups Management */}
      <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ color: '#ec4899', margin: '0 0 20px 0', fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-users"></i> مجموعات الطلاب
        </h2>
        
        {editingGroupId !== null ? (
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <input 
              type="text" 
              placeholder="اسم المجموعة (مثل: المجموعة 1)" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
            <input 
              type="text" 
              placeholder="كلمة المرور (مطلوبة للتعديل أو الحذف)" 
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
            />
            <textarea 
              placeholder="أسماء الطلاب (كل اسم في سطر)"
              value={editNamesText}
              onChange={(e) => setEditNamesText(e.target.value)}
              style={{ width: '100%', minHeight: '150px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={handleSaveGroup} style={{ flex: 1, padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>حفظ</button>
              <button onClick={() => setEditingGroupId(null)} style={{ flex: 1, padding: '10px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>إلغاء</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 10px 0' }}>ضعي علامة ✅ بجوار المجموعات التي تريدين إضافتها للعجلة الآن.</p>
            
            {groups.map(g => (
              <div key={g.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flex: 1, fontWeight: 'bold' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedGroupIds.includes(g.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedGroupIds([...selectedGroupIds, g.id]);
                      else setSelectedGroupIds(selectedGroupIds.filter(id => id !== g.id));
                    }}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  {g.name} 
                  {g.password && <i className="fa-solid fa-lock" style={{ color: '#cbd5e1', fontSize: '0.8rem', marginRight: '5px' }} title="محمية بكلمة مرور"></i>}
                  <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 'normal' }}>({g.names.length} طلاب)</span>
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => handleEditGroup(g)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer' }} title="تعديل"><i className="fa-solid fa-pen"></i></button>
                  <button onClick={() => handleDeleteGroup(g)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="حذف"><i className="fa-solid fa-trash"></i></button>
                </div>
              </div>
            ))}

            <button 
              onClick={handleCreateGroup}
              style={{ marginTop: '15px', padding: '12px', background: 'transparent', color: '#ec4899', border: '2px dashed #ec4899', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
            >
              + إضافة مجموعة جديدة
            </button>
          </div>
        )}
      </div>

      {/* The Wheel */}
      <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <div style={{ position: 'relative', width: '350px', height: '350px', marginBottom: '30px' }}>
          {/* Pointer/Arrow */}
          <div style={{ 
            position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', 
            width: '0', height: '0', 
            borderLeft: '20px solid transparent', 
            borderRight: '20px solid transparent', 
            borderTop: '30px solid #ef4444', 
            zIndex: 10, filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.2))' 
          }} />

          {/* Wheel Circle */}
          {names.length > 0 ? (
            <motion.div 
              animate={{ rotate: rotation }}
              transition={{ duration: 4, type: 'tween', ease: 'circOut' }}
              style={{ 
                width: '100%', height: '100%', 
                borderRadius: '50%', 
                background: `conic-gradient(${conicString})`,
                border: '8px solid #334155',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {names.map((name, i) => {
                const rot = i * sliceDegree + (sliceDegree / 2);
                return (
                  <div 
                    key={i} 
                    style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: `translate(-50%, -50%) rotate(${rot}deg) translateY(-110px)`,
                      transformOrigin: 'center center',
                      color: 'white', fontWeight: 'bold', fontSize: '1.2rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {name}
                  </div>
                );
              })}
            </motion.div>
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '8px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
              الرجاء تحديد مجموعة طلاب<br/>لإظهار العجلة
            </div>
          )}
          
          {/* Center Knob */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '40px', height: '40px', background: '#334155', borderRadius: '50%', zIndex: 5, border: '4px solid white' }} />
        </div>

        <button 
          onClick={spinWheel}
          disabled={isSpinning || names.length < 2}
          style={{ padding: '15px 50px', background: isSpinning || names.length < 2 ? '#94a3b8' : '#ec4899', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '1.5rem', cursor: isSpinning || names.length < 2 ? 'default' : 'pointer', boxShadow: '0 10px 20px rgba(236, 72, 153, 0.3)', transition: 'transform 0.2s' }}
        >
          {isSpinning ? 'جاري السحب...' : 'لف العجلة! 🎲'}
        </button>

        {/* Winner Display */}
        {winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{ marginTop: '30px', textAlign: 'center', background: '#f0fdf4', border: '2px solid #4ade80', borderRadius: '16px', padding: '20px 40px' }}
          >
            <p style={{ margin: '0 0 10px 0', color: '#16a34a', fontWeight: 'bold' }}>الطالب الفائز:</p>
            <h3 style={{ margin: 0, color: '#15803d', fontSize: '2.5rem' }}>{winner} 🎉</h3>
          </motion.div>
        )}
      </div>

    </div>
  );
}
