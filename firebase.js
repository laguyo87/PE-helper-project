// Firebase SDK import
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ========================================
// Firebase 설정
// ========================================
const firebaseConfig = {
  apiKey: "AIzaSyB2d_7WBaTIuXfyFceuAGqbKFjZWRelvY0",
  authDomain: "pe-helper-5739e.firebaseapp.com",
  projectId: "pe-helper-5739e",
  storageBucket: "pe-helper-5739e.firebasestorage.app",
  messagingSenderId: "859265361891",
  appId: "1:859265361891:web:dcc26b7bb6e6776210e2d6",
  measurementId: "G-5VCQKBNKZK"
};

try {
  console.log('=== Firebase 초기화 시작 ===');
  
  // Firebase 앱 초기화
  const app = initializeApp(firebaseConfig);
  console.log('Firebase 앱 초기화 완료');
  
  const auth = getAuth(app);
  console.log('Firebase Auth 초기화 완료');
  
  const db = getFirestore(app);
  console.log('Firebase Firestore 초기화 완료');
  
  // Firebase 연결 상태 확인
  console.log('=== Firebase 초기화 성공 ===');
  console.log('Auth 객체:', auth);
  console.log('Firestore 객체:', db);
  
  // Firestore 연결 테스트
  const testDoc = doc(db, 'test', 'connection');
  console.log('Firestore 테스트 문서 참조 생성됨:', testDoc);
  
  // 실제 연결 테스트 수행
  try {
    console.log('=== Firebase 연결 테스트 시작 ===');
    const testDoc = doc(db, 'test', 'connection');
    const testSnap = await getDoc(testDoc);
    console.log('Firebase 연결 테스트 성공:', testSnap.exists() ? '문서 존재' : '문서 없음');
  } catch (error) {
    console.error('Firebase 연결 테스트 실패:', error);
    console.error('오류 코드:', error.code);
    console.error('오류 메시지:', error.message);
  }

  window.firebase = { 
    auth, 
    db, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    GoogleAuthProvider, 
    signInWithPopup, 
    doc, 
    setDoc, 
    getDoc, 
    sendPasswordResetEmail 
  };
  
  console.log('window.firebase 객체 설정 완료');
  
  // Firebase 초기화 완료 이벤트 발생
  window.dispatchEvent(new CustomEvent('firebaseReady'));
  console.log('firebaseReady 이벤트 발생');
  
} catch (error) {
  console.error('=== Firebase 초기화 실패 ===');
  console.error('오류 상세:', error.message);
  console.error('오류 스택:', error.stack);
  console.error('오류 이름:', error.name);
  
  // Firebase 초기화 실패 이벤트 발생
  window.dispatchEvent(new CustomEvent('firebaseError', { detail: error }));
  console.log('firebaseError 이벤트 발생');
}
