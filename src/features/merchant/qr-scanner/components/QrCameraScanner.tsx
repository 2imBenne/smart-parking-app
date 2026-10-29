import { CameraOutlined, PauseOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Select } from 'antd'
import type { CameraDevice, Html5Qrcode } from 'html5-qrcode'
import { useEffect, useRef, useState } from 'react'

type QrCameraScannerProps = {
  disabled?: boolean
  onDecoded: (value: string) => void
}

const readerId = 'merchant-qr-reader'

export function QrCameraScanner({ disabled = false, onDecoded }: QrCameraScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const startingRef = useRef(false)
  const onDecodedRef = useRef(onDecoded)
  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [cameraId, setCameraId] = useState<string>()
  const [scanning, setScanning] = useState(false)
  const [starting, setStarting] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [discovering, setDiscovering] = useState(false)

  onDecodedRef.current = onDecoded

  const stop = async () => {
    const scanner = scannerRef.current
    scannerRef.current = null
    if (scanner?.isScanning) {
      try {
        await scanner.stop()
      } catch {
        // ignore stop race
      }
    }
    try {
      scanner?.clear()
    } catch {
      // ignore clear race
    }
    setScanning(false)
  }

  const start = async (deviceId?: string) => {
    const targetId = deviceId ?? cameraId
    if (!targetId || disabled || startingRef.current) return
    startingRef.current = true
    setStarting(true)
    setCameraError('')
    try {
      await stop()
      const { Html5Qrcode: QrReader } = await import('html5-qrcode')
      const scanner = new QrReader(readerId, { verbose: false })
      scannerRef.current = scanner
      await scanner.start(
        targetId,
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1.777 },
        (decodedText) => {
          const value = decodedText.trim()
          if (!value) return
          void (async () => {
            try {
              await scanner.pause(true)
            } catch {
              // ignore
            }
            setScanning(false)
            onDecodedRef.current(value)
          })()
        },
        () => undefined,
      )
      setScanning(true)
    } catch {
      setCameraError('Không thể bật camera. Camera có thể đang bị app khác dùng hoặc quyền bị từ chối.')
      scannerRef.current = null
      setScanning(false)
    } finally {
      startingRef.current = false
      setStarting(false)
    }
  }

  const discover = async (autoStart = false) => {
    setDiscovering(true)
    setCameraError('')
    try {
      await stop()

      // Một số trình duyệt cần xin quyền trước mới liệt kê được camera.
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        stream.getTracks().forEach((track) => track.stop())
      }

      const { Html5Qrcode: QrReader } = await import('html5-qrcode')
      const devices = await QrReader.getCameras()
      setCameras(devices)
      const preferred =
        devices.find((device) => /back|rear|environment/i.test(device.label))?.id ?? devices[0]?.id
      setCameraId((current) => {
        if (current && devices.some((device) => device.id === current)) return current
        return preferred
      })
      if (devices.length === 0) {
        setCameraError('Không tìm thấy camera trên thiết bị.')
        return
      }
      if (autoStart && preferred && !disabled) {
        // Đợi track tạm từ bước xin quyền được giải phóng trước khi mở lại.
        await new Promise((resolve) => setTimeout(resolve, 350))
        await start(preferred)
      }
    } catch (error) {
      const name = error instanceof DOMException ? error.name : ''
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraError('Quyền camera bị từ chối. Hãy cho phép camera trong trình duyệt rồi bấm Tải lại camera.')
      } else if (name === 'NotFoundError') {
        setCameraError('Không tìm thấy camera trên thiết bị.')
      } else {
        setCameraError('Không thể truy cập camera. Hãy dùng localhost/HTTPS và cấp quyền camera.')
      }
      setCameras([])
      setCameraId(undefined)
    } finally {
      setDiscovering(false)
    }
  }

  useEffect(() => {
    void discover(true)
    return () => {
      void stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (disabled && scanning) void stop()
  }, [disabled, scanning])

  return (
    <section className="merchant-scanner-card">
      <div className="merchant-section-title">
        <div>
          <h2>
            <CameraOutlined /> Camera
          </h2>
          <p>QR được đọc trên thiết bị; chỉ gửi booking code lên backend.</p>
        </div>
        <Button icon={<ReloadOutlined />} loading={discovering} onClick={() => void discover(true)}>
          Tải lại camera
        </Button>
      </div>
      {cameraError && <Alert type="error" showIcon message={cameraError} />}
      <Select
        disabled={scanning || disabled || discovering || starting}
        value={cameraId}
        placeholder={discovering ? 'Đang tìm camera...' : 'Chọn camera'}
        onChange={(value) => setCameraId(value)}
        options={cameras.map((camera) => ({
          value: camera.id,
          label: camera.label || `Camera ${camera.id.slice(0, 8)}`,
        }))}
        style={{ width: '100%', marginBottom: 12 }}
      />
      <div id={readerId} className="merchant-qr-reader" />
      <div className="merchant-scanner-actions">
        {scanning ? (
          <Button danger icon={<PauseOutlined />} onClick={() => void stop()}>
            Dừng camera
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={discovering || starting}
            disabled={!cameraId || disabled || discovering || starting}
            onClick={() => void start()}
          >
            Bật camera
          </Button>
        )}
      </div>
    </section>
  )
}
