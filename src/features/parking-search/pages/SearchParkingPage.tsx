import { AlertCircle, Crosshair, LocateFixed, MapPin, Navigation, Search, Star, Truck } from 'lucide-react'
import { Empty, Select, Skeleton, Slider, Switch, message } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { AxiosError } from 'axios'
import { extractApiError } from '../../../shared/api/errors'
import { DriverParkingMap } from '../components/DriverParkingMap'
import { InlineQuickBookPanel } from '../components/InlineQuickBookPanel'
import { getParkingLotDetail } from '../api/parkingApi'
import type { ParkingLotDto } from '../types/parkingTypes'
import { VEHICLE_TYPE_LABELS, type VehicleType } from '../../vehicles/types/vehicleTypes'
import { useSearchParking } from '../hooks/useSearchParking'

export function SearchParkingPage() {
  const navigate = useNavigate()
  const {
    vehicles,
    vehicleId,
    setVehicleId,
    vehicle,
    vehicleTypeFilter,
    setVehicleTypeFilter,
    keyword,
    distance,
    setDistance,
    sort,
    setSort,
    includeFull,
    setIncludeFull,
    lots,
    loading,
    selectedId,
    searchPosition,
    pendingMapPosition,
    destination,
    setDestination,
    locationState,
    locationError,
    suggestions,
    suggestionsOpen,
    setSuggestionsOpen,
    suggestionsLoading,
    activeSuggestion,
    route,
    selectedLot,
    searchBoxRef,
    chooseSuggestion,
    inputKeyDown,
    locateMe,
    onKeywordChange,
    confirmMapPosition,
    pickMapPosition,
    selectParkingLot,
    load,
    customPosition,
    userPosition,
  } = useSearchParking()

  const [quickBookLotId, setQuickBookLotId] = useState<number | null>(null)
  const [quickBookLot, setQuickBookLot] = useState<ParkingLotDto | null>(null)
  const [quickBookLoading, setQuickBookLoading] = useState(false)

  const distanceLabel = customPosition
    ? 'Cách điểm đã chọn'
    : destination
      ? `Cách ${destination.name}`
      : userPosition
        ? 'Cách bạn'
        : 'Khoảng cách mẫu'
  const routeDistance = route?.distanceKm ?? selectedLot?.distanceKm
  const routeDuration = route?.durationMinutes ?? selectedLot?.etaMinutes
  const openDirections = () => {
    if (!searchPosition || !selectedLot) return
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${searchPosition.latitude},${searchPosition.longitude}&destination=${selectedLot.latitude},${selectedLot.longitude}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  const openQuickBook = async (lot: ParkingLotDto) => {
    const totalCapacity = lot.slots.reduce((sum, slot) => sum + slot.totalCapacity, 0)
    if (!totalCapacity) {
      message.warning('Bãi chưa cấu hình sức chứa. Hãy xem chi tiết hoặc chọn bãi khác.')
      return
    }
    selectParkingLot(lot.id)
    if (quickBookLotId === lot.id && quickBookLot) {
      setQuickBookLotId(null)
      setQuickBookLot(null)
      return
    }
    setQuickBookLotId(lot.id)
    setQuickBookLoading(true)
    try {
      const detail = await getParkingLotDetail(lot.id)
      setQuickBookLot({
        ...detail,
        distanceKm: lot.distanceKm,
        etaMinutes: lot.etaMinutes,
      })
    } catch (error) {
      message.error(extractApiError(error as AxiosError))
      setQuickBookLotId(null)
      setQuickBookLot(null)
    } finally {
      setQuickBookLoading(false)
    }
  }

  const closeQuickBook = () => {
    setQuickBookLotId(null)
    setQuickBookLot(null)
  }

  return (
    <main className="parking-search-page">
      <section className="parking-toolbar">
        <div className="parking-mode-heading">
          <div>
            <span>TÌM BÃI GẦN BẠN</span>
            <h1>Bạn muốn đỗ xe ở đâu?</h1>
          </div>
          <button
            className={locationState === 'success' && !destination ? 'locate-main active' : 'locate-main'}
            onClick={locateMe}
            disabled={locationState === 'loading'}
          >
            {locationState === 'loading' ? (
              <>
                <span className="location-spinner" /> Đang xác định...
              </>
            ) : (
              <>
                <LocateFixed /> Dùng vị trí của tôi
              </>
            )}
          </button>
        </div>
        {destination && (
          <div className="location-success">
            <MapPin />
            <div>
              <strong>Đang tìm quanh {destination.name}</strong>
              <span>{destination.address}</span>
            </div>
            <button
              onClick={() => {
                setDestination(null)
                onKeywordChange('')
              }}
            >
              Thay đổi
            </button>
          </div>
        )}
        {customPosition && (
          <div className="custom-position-active">
            <Navigation />
            <div>
              <strong>Đang dùng điểm xuất phát đã chọn</strong>
              <span>Khoảng cách và tuyến đường được tính từ điểm màu cam trên bản đồ.</span>
            </div>
            {userPosition && (
              <button
                onClick={() => {
                  confirmMapPosition()
                  onKeywordChange('Vị trí hiện tại của tôi')
                  message.success('Đã quay lại vị trí GPS')
                }}
              >
                Quay lại GPS
              </button>
            )}
          </div>
        )}
        {locationState === 'error' && (
          <div className="location-error">
            <AlertCircle />
            <span>{locationError}</span>
            <button onClick={locateMe}>Thử lại</button>
          </div>
        )}
        <div className="parking-search-row">
          <label className="location-autocomplete" ref={searchBoxRef}>
            <MapPin />
            <input
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen}
              aria-controls="location-suggestion-list"
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              onFocus={() => setSuggestionsOpen(true)}
              onKeyDown={inputKeyDown}
              placeholder="Nhập tên bãi, địa chỉ hoặc điểm đến"
            />
            <button type="button" onClick={locateMe} title="Dùng vị trí hiện tại">
              <Crosshair />
            </button>
            {suggestionsOpen && keyword.trim().length >= 2 && !destination && (
              <div className="location-suggestions" id="location-suggestion-list" role="listbox">
                {suggestionsLoading ? (
                  <div className="suggestion-empty">
                    <span className="location-spinner" />
                    <span>Đang tìm địa điểm...</span>
                  </div>
                ) : suggestions.length ? (
                  suggestions.map((item, index) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeSuggestion}
                      className={index === activeSuggestion ? 'active' : ''}
                      key={item.id}
                      onClick={() => chooseSuggestion(item)}
                    >
                      <span className={`suggestion-icon ${item.type.toLowerCase()}`}>
                        <MapPin />
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.address}</small>
                      </span>
                      {item.distanceKm !== undefined && <em>{formatDistance(item.distanceKm)} km</em>}
                    </button>
                  ))
                ) : (
                  <div className="suggestion-empty">
                    <Search />
                    <span>Không tìm thấy địa điểm. Hãy thử tên hoặc địa chỉ khác.</span>
                  </div>
                )}
                <footer>Dùng ↑ ↓ để chọn · Enter để xác nhận</footer>
              </div>
            )}
          </label>
          <label className="vehicle-picker">
            <Truck />
            {vehicles.length > 0 ? (
              <select
                value={vehicleId !== undefined ? String(vehicleId) : `type:${vehicleTypeFilter}`}
                onChange={(event) => {
                  const val = event.target.value
                  if (val.startsWith('type:')) {
                    setVehicleId(undefined)
                    setVehicleTypeFilter(val.replace('type:', '') as VehicleType)
                  } else {
                    const id = Number(val)
                    setVehicleId(id)
                    const v = vehicles.find((item) => item.id === id)
                    if (v) setVehicleTypeFilter(v.vehicleType)
                  }
                }}
              >
                <optgroup label="Xe của bạn">
                  {vehicles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.licensePlate} · {VEHICLE_TYPE_LABELS[item.vehicleType]}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Tìm theo loại xe khác">
                  <option value="type:CAR_4_7">Ô tô 4-7 chỗ</option>
                  <option value="type:TRUCK_LIGHT">Xe tải nhẹ (&lt;3.5T)</option>
                  <option value="type:TRUCK_HEAVY">Xe tải nặng (&gt;3.5T)</option>
                  <option value="type:CONTAINER">Xe Container</option>
                </optgroup>
              </select>
            ) : (
              <select
                value={vehicleTypeFilter}
                onChange={(event) => setVehicleTypeFilter(event.target.value as VehicleType)}
              >
                <option value="CAR_4_7">🚗 Ô tô 4-7 chỗ</option>
                <option value="TRUCK_LIGHT">🚚 Xe tải nhẹ (&lt;3.5T)</option>
                <option value="TRUCK_HEAVY">🚛 Xe tải nặng (&gt;3.5T)</option>
                <option value="CONTAINER">🚜 Xe Container</option>
              </select>
            )}
          </label>
          <button onClick={() => void load()}>
            <Search /> Tìm bãi
          </button>
        </div>
        <div className="driver-filter-panel">
          <label>
            Bán kính tìm kiếm <strong>{distance} km</strong>
            <Slider min={2} max={30} value={distance} onChange={setDistance} />
          </label>
          <label>
            Sắp xếp
            <Select
              value={sort}
              onChange={setSort}
              options={[
                { value: 'distance', label: 'Gần nhất' },
                { value: 'price', label: 'Giá thấp nhất' },
                { value: 'rating', label: 'Đánh giá cao' },
              ]}
            />
          </label>
          <label className="full-lot-switch">
            Hiện bãi đầy để xếp hàng <Switch checked={includeFull} onChange={setIncludeFull} />
          </label>
        </div>
      </section>
      <section className="parking-results-layout">
        <DriverParkingMap
          lots={lots}
          selectedId={selectedId}
          userPosition={searchPosition}
          pickedPosition={pendingMapPosition}
          routeCoordinates={route?.coordinates}
          onSelect={selectParkingLot}
          onPositionPick={pickMapPosition}
          onConfirmPicked={confirmMapPosition}
          onCancelPicked={() => pickMapPosition(null)}
        />
        <section className="parking-list">
          <header>
            <div>
              <span>KẾT QUẢ PHÙ HỢP</span>
              <h1>{lots.length} bãi đỗ</h1>
            </div>
            {vehicle && (
              <p>
                Cho xe <strong>{vehicle.licensePlate}</strong>
              </p>
            )}
          </header>
          {selectedLot && searchPosition && (
            <div className="selected-route-summary">
              <Navigation />
              <div>
                <small>TUYẾN ĐƯỜNG ĐANG CHỌN</small>
                <strong>{selectedLot.name}</strong>
                <span>
                  {distanceLabel} {formatDistance(routeDistance)} km · khoảng {routeDuration} phút
                </span>
                <span className="route-endpoints">
                  Từ {customPosition ? 'điểm xuất phát đã chọn' : (destination?.name ?? 'vị trí GPS hiện tại')} →{' '}
                  {selectedLot.name}
                </span>
              </div>
              <button onClick={openDirections}>Chỉ đường</button>
            </div>
          )}
          {loading ? (
            <Skeleton active />
          ) : !lots.length ? (
            <Empty description="Không có bãi trong bán kính này. Hãy tăng bán kính hoặc chọn khu vực khác." />
          ) : (
            lots.map((lot) => {
              const availableCapacity = lot.slots.reduce((sum, slot) => sum + slot.availableCapacity, 0)
              const totalCapacity = lot.slots.reduce((sum, slot) => sum + slot.totalCapacity, 0)
              const isQuickBooking = quickBookLotId === lot.id
              return (
                <article
                  className={`${selectedId === lot.id ? 'parking-result-card selected' : 'parking-result-card'}${isQuickBooking ? ' booking-open' : ''}`}
                  key={lot.id}
                  onClick={() => selectParkingLot(lot.id)}
                >
                  <div className="lot-demo-image">
                    <Truck />
                  </div>
                  <div>
                    <div className="lot-card-top">
                      <span className={availableCapacity ? '' : 'full'}>
                        {totalCapacity
                          ? availableCapacity
                            ? `${availableCapacity}/${totalCapacity} trống · đặt theo giờ`
                            : `Đầy vật lý · sức chứa ${totalCapacity}`
                          : 'Chưa cấu hình sức chứa'}
                      </span>
                      <em>
                        <Star fill="currentColor" /> {lot.ratingAverage}
                      </em>
                    </div>
                    <h2>{lot.name}</h2>
                    <p>
                      <MapPin /> {lot.address}
                    </p>
                    <dl>
                      <div>
                        <dt>{distanceLabel}</dt>
                        <dd>{formatDistance(lot.distanceKm)} km</dd>
                      </div>
                      <div>
                        <dt>ETA dự kiến</dt>
                        <dd>{lot.etaMinutes} phút</dd>
                      </div>
                      <div>
                        <dt>Giá từ</dt>
                        <dd>{formatMoney(lot.pricingRules[0]?.basePricePerHour ?? 0)}/giờ</dd>
                      </div>
                    </dl>
                    <div className="parking-card-actions">
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/dashboard/parking/${lot.id}`)
                        }}
                      >
                        Xem chi tiết
                      </button>
                      <button
                        className="outline"
                        onClick={(event) => {
                          event.stopPropagation()
                          selectParkingLot(lot.id)
                        }}
                      >
                        <Navigation /> Hiện tuyến
                      </button>
                      <button
                        className="book-now"
                        disabled={!totalCapacity || (quickBookLoading && quickBookLotId === lot.id)}
                        onClick={(event) => {
                          event.stopPropagation()
                          void openQuickBook(lot)
                        }}
                      >
                        {quickBookLoading && quickBookLotId === lot.id
                          ? 'Đang mở...'
                          : isQuickBooking
                            ? 'Đóng form'
                            : 'Đặt luôn'}
                      </button>
                    </div>
                  </div>
                  {isQuickBooking && (
                    quickBookLoading || !quickBookLot ? (
                      <div className="parking-inline-book loading" onClick={(event) => event.stopPropagation()}>
                        <Skeleton active paragraph={{ rows: 3 }} />
                      </div>
                    ) : (
                      <InlineQuickBookPanel
                        lot={quickBookLot}
                        vehicles={vehicles}
                        preferredVehicleId={vehicleId}
                        onClose={closeQuickBook}
                      />
                    )
                  )}
                </article>
              )
            })
          )}
        </section>
      </section>
    </main>
  )
}

function formatMoney(value: number) {
  return `${new Intl.NumberFormat('vi-VN').format(value)}đ`
}

function formatDistance(value?: number | null) {
  if (value == null || isNaN(value)) return '0.00'
  return Number(value).toFixed(2)
}
