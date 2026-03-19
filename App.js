import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';

const SOUND_SUCCESS = require('./success.mp3');
const SOUND_FAIL = require('./fail.mp3');

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanTime, setScanTime] = useState(null);
  const [scanType, setScanType] = useState(null);
  const [isSuccess, setIsSuccess] = useState(true);
  const [torch, setTorch] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const playSound = async (isSuccessSound) => {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const soundFile = isSuccessSound ? SOUND_SUCCESS : SOUND_FAIL;
      const { sound } = await Audio.Sound.createAsync(soundFile);
      soundRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
      });
    } catch (e) {
      console.log('Sound error:', e);
    }
  };

  const vibrate = (isSuccessVibe) => {
    if (isSuccessVibe) {
      Vibration.vibrate([0, 200, 100, 200]);
    } else {
      Vibration.vibrate([0, 500, 200, 500]);
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setScanResult(data);
    setScanType(type);
    setScanTime(new Date().toLocaleString('zh-CN'));
    setIsSuccess(true);
    playSound(true);
    vibrate(true);
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScanResult(null);
    setScanTime(null);
    setScanType(null);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>正在请求相机权限...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>⚠️ 没有相机权限</Text>
        <Text style={styles.subMessage}>请在设置中开启相机权限</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>授权相机</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📱 PM码扫码器</Text>
        <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch(!torch)}>
          <Text style={styles.torchText}>{torch ? '🔦 闪光灯关' : '💡 闪光灯开'}</Text>
        </TouchableOpacity>
      </View>

      {!scanned ? (
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            enableTorch={torch}
            onBarcodeScanned={handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'pdf417',
                'ean13',
                'ean8',
                'code128',
                'code39',
                'code93',
                'upc_e',
                'upc_a',
                'codabar',
                'itf14',
                'data_matrix',
                'aztec',
                'interleaved2of5',
              ],
            }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.hint}>将二维码/条码放入框内自动扫描</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.resultContainer, isSuccess ? styles.successBorder : styles.failBorder]}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultIcon}>{isSuccess ? '✅' : '❌'}</Text>
            <Text style={styles.resultTitle}>{isSuccess ? '扫码成功' : '扫码失败'}</Text>
          </View>

          <View style={styles.resultBody}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>码类型：</Text>
              <Text style={styles.resultValue}>{scanType ? scanType.replace(/_/g, ' ') : '未知'}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>扫码时间：</Text>
              <Text style={styles.resultValue}>{scanTime || '-'}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>内容：</Text>
            </View>
            <View style={styles.contentBox}>
              <Text style={styles.contentText}>{scanResult || '-'}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleScanAgain}>
            <Text style={styles.buttonText}>🔄 继续扫码</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  torchBtn: {
    backgroundColor: '#16213e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  torchText: {
    color: '#00d4ff',
    fontSize: 13,
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00d4ff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  hint: {
    color: '#fff',
    marginTop: 20,
    fontSize: 14,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#16213e',
  },
  successBorder: {
    borderWidth: 2,
    borderColor: '#00ff88',
  },
  failBorder: {
    borderWidth: 2,
    borderColor: '#ff4757',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultBody: {
    flex: 1,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  resultLabel: {
    fontSize: 15,
    color: '#aaa',
    width: 80,
  },
  resultValue: {
    fontSize: 15,
    color: '#fff',
    flex: 1,
  },
  contentBox: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 16,
    marginTop: 8,
    maxHeight: 300,
  },
  contentText: {
    color: '#e0e0e0',
    fontSize: 15,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  message: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
  subMessage: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 10,
  },
});
