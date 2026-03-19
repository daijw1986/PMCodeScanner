import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Vibration, Platform, Linking } from 'react-native';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';

const SOUND_SUCCESS = require('./success.mp3');
const SOUND_FAIL = require('./fail.mp3');

// 支持的码类型（包含 Data Matrix / DM码）
const BARCODE_TYPES = [
  'qr',
  'data_matrix',
  'pdf417',
  'aztec',
  'codabar',
  'code128',
  'code39',
  'code93',
  'ean13',
  'ean8',
  'upc_e',
  'upc_a',
  'itf14',
  'interleaved2of5',
];

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanTime, setScanTime] = useState(null);
  const [scanType, setScanType] = useState(null);
  const [isSuccess, setIsSuccess] = useState(true);
  const [torch, setTorch] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState('back');
  const soundRef = useRef(null);
  const cameraRef = useRef(null);
  const lastScanTime = useRef(0);

  useEffect(() => {
    return () => {
      if (soundRef.current) soundRef.current.unloadAsync();
    };
  }, []);

  const playSound = async (isSuccessSound) => {
    try {
      if (soundRef.current) await soundRef.current.unloadAsync();
      const soundFile = isSuccessSound ? SOUND_SUCCESS : SOUND_FAIL;
      const { sound } = await Audio.Sound.createAsync(soundFile, { shouldPlay: true });
      soundRef.current = sound;
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

  // 防抖：500ms 内不重复处理同一帧
  const handleBarCodeScanned = useCallback(({ type, data }) => {
    const now = Date.now();
    if (now - lastScanTime.current < 800) return;
    lastScanTime.current = now;

    setScanned(true);
    setScanResult(data);
    setScanType(type);
    setScanTime(new Date().toLocaleString('zh-CN'));
    setIsSuccess(true);
    playSound(true);
    vibrate(true);
  }, []);

  const handleScanAgain = useCallback(async () => {
    setScanned(false);
    setScanResult(null);
    setScanTime(null);
    setScanType(null);
    // 等待 CameraView 完全重新初始化
    await new Promise(resolve => setTimeout(resolve, 300));
    setCameraReady(false);
    setTimeout(() => setCameraReady(true), 100);
  }, []);

  const toggleCamera = () => {
    setFacing(f => (f === 'back' ? 'front' : 'back'));
  };

  const openSettings = () => {
    Linking.openSettings();
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
        <Text style={styles.message}>⚠️ 需要相机权限</Text>
        <Text style={styles.subMessage}>请在设置中开启相机权限以扫描二维码</Text>
        <TouchableOpacity style={styles.button} onPress={permission.canAskAgain ? requestPermission : openSettings}>
          <Text style={styles.buttonText}>{permission.canAskAgain ? '授权相机' : '打开设置'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📱 PM码扫码器</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch(!torch)}>
            <Text style={styles.torchText}>{torch ? '🔦 关' : '💡 开'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.torchBtn} onPress={toggleCamera}>
            <Text style={styles.torchText}>🔄 翻转</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!scanned ? (
        <View style={styles.cameraContainer}>
          <CameraView
            key={facing}
            style={styles.camera}
            facing={facing}
            enableTorch={torch}
            onCameraReady={() => setCameraReady(true)}
            onBarcodeScanned={cameraReady ? handleBarCodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: BARCODE_TYPES,
            }}
          />
          {!cameraReady && (
            <View style={styles.cameraLoading}>
              <Text style={styles.cameraLoadingText}>相机初始化中...</Text>
            </View>
          )}
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.hint}>将二维码/DM码放入框内</Text>
            <Text style={styles.hintSub}>支持：二维码、Data Matrix、PDF417、条形码</Text>
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
              <Text style={styles.resultValue}>{scanType ? formatCodeType(scanType) : '未知'}</Text>
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

// 码类型友好名称
function formatCodeType(type) {
  const map = {
    qr: '二维码 (QR)',
    data_matrix: 'Data Matrix (DM码)',
    pdf417: 'PDF417',
    aztec: 'Aztec',
    codabar: 'Codabar',
    code128: 'Code 128',
    code39: 'Code 39',
    code93: 'Code 93',
    ean13: 'EAN-13',
    ean8: 'EAN-8',
    upc_e: 'UPC-E',
    upc_a: 'UPC-A',
    itf14: 'ITF-14',
    interleaved2of5: '交叉25码',
  };
  return map[type] || type;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  torchBtn: {
    backgroundColor: '#16213e',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#00d4ff33',
  },
  torchText: {
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cameraLoadingText: {
    color: '#00d4ff',
    fontSize: 16,
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
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
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
    marginTop: 24,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  hintSub: {
    color: '#aaa',
    marginTop: 6,
    fontSize: 12,
    textAlign: 'center',
  },
  resultContainer: {
    flex: 1,
    margin: 16,
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
    fontSize: 30,
    marginRight: 12,
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
    alignItems: 'flex-start',
  },
  resultLabel: {
    fontSize: 14,
    color: '#888',
    width: 72,
    paddingTop: 2,
  },
  resultValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  contentBox: {
    backgroundColor: '#0f3460',
    borderRadius: 10,
    padding: 16,
    marginTop: 4,
    maxHeight: 320,
  },
  contentText: {
    color: '#e0e0e0',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
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
    marginHorizontal: 40,
  },
});
