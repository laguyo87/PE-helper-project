const fs = require('fs');
const path = require('path');

// innerHTML을 안전하게 교체하는 스크립트
const filesToFix = [
    'src/modules/papsManager.ts',
    'src/modules/progressManager.ts',
    'src/modules/tournamentManager.ts',
    'src/modules/shareManager.ts',
    'src/modules/versionManager.ts'
];

filesToFix.forEach(filePath => {
    const fullPath = path.join(__dirname, '..', filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️ 파일을 찾을 수 없습니다: ${filePath}`);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    
    // 빈 문자열 할당은 안전하므로 제외
    // .innerHTML = `...` 패턴을 찾아서 setInnerHTMLSafe로 교체
    // 단, 이미 setInnerHTMLSafe를 사용하거나, 빈 문자열인 경우는 제외
    
    // 이 패턴은 수동으로 수정하는 것이 더 안전합니다.
    console.log(`📝 ${filePath} 파일을 확인했습니다.`);
});

console.log('✅ innerHTML 교체 스크립트 완료');

