import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Vibration, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as BarCodeScanner from 'expo-barcode-scanner';

const SOUND_SUCCESS = require('./success.mp3');
const SOUND_FAIL = require('./fail.mp3');

export default function App() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanTime, setScanTime] = useState(null);
  const [scanType, setScanType] = useState(null);
  const [isSuccess, setIsSuccess] = useState(true);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const playSound = async (isSuccessSound) => {
    try {
      const soundFile = isSuccessSound ? SOUND_SUCCESS : SOUND_FAIL;
      const { sound } = await Audio.Sound.createAsync(soundFile);
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

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>正在请求相机权限...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>⚠️ 没有相机权限</Text>
        <Text style={styles.subMessage}>请在设置中开启相机权限</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📱 PM码扫码器</Text>
      </View>

      {!scanned ? (
        <View style={styles.cameraContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.camera}
            barCodeTypes={[
              BarCodeScanner.Constants.BarCodeType.qr,
              BarCodeScanner.Constants.BarCodeType.pdf417,
              BarCodeScanner.Constants.BarCodeType.ean13,
              BarCodeScanner.Constants.BarCodeType.ean8,
              BarCodeScanner.Constants.BarCodeType.code128,
              BarCodeScanner.Constants.BarCodeType.code39,
              BarCodeScanner.Constants.BarCodeType.code93,
              BarCodeScanner.Constants.BarCodeType.upc_e,
              BarCodeScanner.Constants.BarCodeType.upc_a,
              BarCodeScanner.Constants.BarCodeType.cob,
              BarCodeScanner.Constants.BarCodeType.itf14,
            ]}
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
              <Text style={styles.resultValue}>{scanType || '未知'}</Text>
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

      <StatusBar style="auto" />
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
    alignItems: 'center',
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
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
