/**
 * サウンド効果
 * 高凝集度: オーディオ機能のみを担当
 * 低結合度: 他のモジュールに依存しない
 */

export class AudioManager {
    static enabled = true;

    /**
     * サウンドのオン/オフを切り替え
     * @returns {boolean} - 新しい状態
     */
    static toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    /**
     * サウンド効果を再生
     * @param {string} type - 'drop' or 'win'
     */
    static play(type) {
        if (!this.enabled) return;

        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (type === 'drop') {
                oscillator.frequency.value = 300;
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } else if (type === 'win') {
                oscillator.frequency.value = 523.25; // C5
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
            }
        } catch (error) {
            console.error('Audio playback failed:', error);
        }
    }

    /**
     * サウンドが有効かチェック
     * @returns {boolean}
     */
    static isEnabled() {
        return this.enabled;
    }

    /**
     * サウンドを有効化
     */
    static enable() {
        this.enabled = true;
    }

    /**
     * サウンドを無効化
     */
    static disable() {
        this.enabled = false;
    }
}
