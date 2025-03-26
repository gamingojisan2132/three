// 効果音の設定
let gameSounds = {};

// 効果音を再生する関数
function playSound(soundType) {
    try {
        console.log(`効果音再生リクエスト: ${soundType}`);
        
        // HTMLから直接Audio要素を取得
        let soundElement;
        switch(soundType) {
            case 'select':
                soundElement = document.getElementById('select-sound');
                break;
            case 'match':
                soundElement = document.getElementById('match-sound');
                break;
            case 'gameOver':
                soundElement = document.getElementById('gameover-sound');
                break;
            default:
                console.error(`不明な効果音タイプ: ${soundType}`);
                return;
        }
        
        if (soundElement) {
            // 音声を最初から再生
            soundElement.currentTime = 0;
            soundElement.volume = 0.5;
            
            // 音声を再生
            const playPromise = soundElement.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`${soundType}の効果音再生成功`);
                }).catch(error => {
                    console.error(`${soundType}の効果音再生に失敗しました:`, error);
                });
            }
        } else {
            console.error(`効果音要素 ${soundType} が見つかりません`);
        }
    } catch (e) {
        console.error(`効果音 ${soundType} の再生中にエラーが発生しました:`, e);
    }
}
