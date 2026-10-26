<template>
  <span ref="portalAnchor" hidden></span>
  <Teleport v-if="portalTarget" :to="portalTarget">
    <dialog
      ref="dialog"
      class="amami-campus-map"
      :class="{ 'is-closing': closing }"
      :style="frameStyle"
      :data-schedule-period="schedulePeriod"
      :aria-labelledby="titleId"
      @cancel.prevent="handleCancel"
      @keydown.stop="handleKeydown"
      @click="handleBackdropClick"
    >
      <span
        v-for="corner in ['top-left', 'top-right', 'bottom-left', 'bottom-right']"
        :key="corner"
        class="amami-map-corner"
        :class="corner"
        aria-hidden="true"
      ></span>
      <header class="amami-map-header" :inert="travelDestination ? true : undefined">
        <div class="amami-map-heading">
          <span class="amami-map-brand" aria-hidden="true"><MapIcon name="map" /></span>
          <h2 :id="titleId">校园地图 <span>天海学园</span></h2>
        </div>
        <div class="amami-map-current">
          <MapIcon name="pin" />
          <div>
            <span>当前位置</span><strong>{{ locationLabel }}</strong
            ><small>{{ timeLabel }}</small>
          </div>
        </div>
        <button
          type="button"
          class="amami-map-directory-toggle"
          :aria-expanded="directoryOpen"
          :aria-controls="directoryId"
          @click="toggleDirectory"
        >
          <MapIcon name="search" /><span>地点目录</span>
        </button>
        <button type="button" class="amami-map-close" aria-label="关闭地图" autofocus @click="requestClose">
          <MapIcon name="back" /><span>返回</span>
        </button>
      </header>
      <p class="amami-map-sr-only" role="status">{{ selectionAnnouncement }}</p>
      <p class="amami-map-sr-only" role="status">{{ quickPlaceAnnouncement }}</p>
      <div
        class="amami-map-body"
        :class="{ 'has-directory': directoryOpen }"
        :inert="travelDestination ? true : undefined"
      >
        <section class="amami-map-scene" aria-label="学园地图">
          <div class="amami-map-toolbar">
            <div class="amami-map-toolbar-actions">
              <button
                type="button"
                class="amami-map-label-toggle"
                :aria-label="showLabels ? '隐藏地标' : '显示地标'"
                :title="showLabels ? '隐藏地标' : '显示地标'"
                :aria-pressed="showLabels"
                @click="showLabels = !showLabels"
              >
                <MapIcon name="labels" />
                <span>{{ showLabels ? '隐藏地标' : '显示地标' }}</span>
              </button>
              <button
                type="button"
                class="amami-map-locate"
                aria-label="定位当前位置"
                title="定位当前位置"
                :disabled="!currentMapAnchor"
                @click="locateCurrent"
              >
                <MapIcon name="target" /><span>当前位置</span>
              </button>
            </div>
          </div>
          <div
            ref="viewport"
            class="amami-map-viewport"
            :style="oceanStyle"
            :class="{
              'is-dragging': dragging,
              'is-emphasizing': !!emphasizedRegion,
              'has-selection': !!selectedMapRegion,
              'is-moving': moving,
            }"
            tabindex="0"
            aria-label="校园地图画布，可拖动、滚轮缩放，方向键平移，加减键缩放，0 恢复全图"
            @wheel.prevent="handleWheel"
            @pointerdown="pointerDown"
            @pointermove="pointerMove"
            @pointerup="pointerUp"
            @pointercancel="pointerUp"
            @lostpointercapture="pointerUp"
            @click="clearSelectionFromCanvas"
          >
            <div class="amami-map-ambient-shade" aria-hidden="true"></div>
            <div v-if="loading || loadError" class="amami-map-loading" role="status">
              <template v-if="loading"><span class="amami-map-loader"></span>正在展开校园地图…</template>
              <template v-else
                ><strong>地图暂时无法展开</strong><span>{{ loadError }}</span
                ><button type="button" @click="loadArtwork">重新加载</button></template
              >
            </div>
            <div v-else class="amami-map-artboard" :style="boardStyle">
              <div class="amami-map-paint" :style="oceanMask ? { maskImage: `url(${oceanMask})` } : undefined">
                <img
                  class="amami-map-artwork"
                  :src="artwork"
                  width="1672"
                  height="941"
                  alt="天海学园校园全景：教学楼、宿舍、神社和海岸"
                  draggable="false"
                />
                <Transition name="amami-map-spotlight">
                  <svg
                    v-if="emphasizedRegion"
                    :key="emphasizedRegion.id"
                    class="amami-map-emphasis"
                    viewBox="0 0 1672 941"
                    aria-hidden="true"
                  >
                    <defs>
                      <mask
                        :id="`${spotlightId}-${emphasizedRegion.id}`"
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="1672"
                        height="941"
                      >
                        <rect width="1672" height="941" fill="white" />
                        <path
                          v-for="(outline, index) in emphasizedRegion?.outlines ?? []"
                          :key="index"
                          :d="outline"
                          fill="black"
                          fill-rule="nonzero"
                        />
                      </mask>
                    </defs>
                    <rect
                      class="amami-map-shade"
                      width="1672"
                      height="941"
                      :mask="`url(#${spotlightId}-${emphasizedRegion.id})`"
                    />
                  </svg>
                </Transition>
              </div>
              <svg class="amami-map-hit-layer" viewBox="0 0 1672 941" aria-label="校园区域与地点">
                <defs>
                  <image :id="artworkId" :href="artwork" width="1672" height="941" />
                  <path
                    v-if="selectedLocation?.landmark.anchor"
                    class="amami-map-preview-measure"
                    :d="selectedLocation.landmark.outline"
                  />
                </defs>
                <g
                  v-for="place in interactiveRegions"
                  :key="place.id"
                  class="amami-map-landmark"
                  :data-region-id="place.id"
                  :class="{
                    'is-selected': selectedMapRegion?.id === place.id,
                    'is-current': !!currentMapAnchor && currentPlace?.region.id === place.id,
                  }"
                  role="button"
                  tabindex="0"
                  :aria-label="`${place.name}，${place.destinations.length}个地点`"
                  :aria-pressed="selectedMapRegion?.id === place.id"
                  @click.stop="selectRegion(place, true)"
                  @keydown.enter.prevent="selectRegion(place)"
                  @keydown.space.prevent="selectRegion(place)"
                  @pointerenter="hoveredId = place.id"
                  @pointerleave="hoveredId = null"
                  @focus="focusedRegionId = place.id"
                  @blur="focusedRegionId = null"
                >
                  <path
                    v-for="(outline, index) in place.outlines"
                    :key="index"
                    class="amami-map-hit"
                    :d="outline"
                    fill-rule="nonzero"
                  />
                </g>
                <g
                  v-if="currentMapAnchor"
                  class="amami-map-position"
                  :transform="`translate(${currentMapAnchor.join(' ')})`"
                  aria-hidden="true"
                >
                  <circle r="20" class="amami-map-position-pulse" />
                  <circle r="20" class="amami-map-position-ring" />
                  <circle r="8" />
                </g>
              </svg>
              <div
                v-if="selectedMapRegion"
                :key="selectionPulse"
                class="amami-map-reticle"
                :style="anchorStyle(selectedMapRegion)"
                aria-hidden="true"
              >
                <i></i><i></i><i></i><i></i>
              </div>
              <TransitionGroup name="amami-map-label-motion">
                <button
                  v-for="place in visibleLabels"
                  :key="`label-${place.id}`"
                  type="button"
                  class="amami-map-label"
                  :class="{
                    'is-selected': selectedMapRegion?.id === place.id,
                    'is-location': selectedMapRegion?.id === place.id && !!selectedLocation,
                    'is-interactive': showLabels,
                    'is-keyboard-focus': focusedRegionId === place.id,
                    'has-followers': followedRegionIds.has(place.id) && !followedMarkersBelow.has(place.id),
                  }"
                  :tabindex="showLabels ? 0 : -1"
                  :style="anchorStyle(place)"
                  @click.stop="selectRegion(place, $event.detail !== 0)"
                >
                  <span class="amami-map-label-number">{{ regionNumber(place) }}</span>
                  <span class="amami-map-label-copy">
                    <small>{{
                      selectedMapRegion?.id === place.id ? (selectedLocation ? '地点所属区域' : '正在查看') : '查看区域'
                    }}</small>
                    <strong>{{ place.name }}</strong>
                  </span>
                  <MapIcon v-if="selectedMapRegion?.id === place.id" name="check" />
                </button>
              </TransitionGroup>
              <CampusFollowMarkers
                :groups="followedGroups"
                :placements="followedMarkerPlacements"
                @select="openFollowedPerson"
                @group="openFollowGroup"
              />
            </div>
            <div class="amami-map-compass" aria-hidden="true">
              <span>后山</span
              ><svg viewBox="0 0 24 36">
                <path d="M12 2 4 22l8-4 8 4Z" />
                <path d="M12 18v16" /></svg
              ><small>海岸</small>
            </div>
          </div>
          <footer class="amami-map-footer">
            <span class="amami-map-footer-location"
              ><i></i><small>当前位置</small> {{ currentPlace ? locationLabel : '等待地点同步' }}</span
            >
            <span v-if="!selectedRegion" class="amami-map-hint">点击区域探索</span>
            <button v-if="selectedRegion" class="amami-map-clear" type="button" @click="clearSelection">
              <MapIcon name="back" />返回全图
            </button>
            <div class="amami-map-zoom" aria-label="地图缩放控制" @pointerdown.stop @click.stop>
              <button
                type="button"
                :disabled="zoom <= overviewZoom + 0.001"
                aria-label="缩小地图"
                title="缩小地图"
                @click="zoomAt(zoom / 1.25)"
              >
                <MapIcon name="minus" />
              </button>
              <span class="amami-map-scale">{{ Math.round((zoom / overviewZoom) * 100) }}<small>%</small></span>
              <button
                type="button"
                :disabled="zoom >= overviewZoom * 4 - 0.001"
                aria-label="放大地图"
                title="放大地图"
                @click="zoomAt(zoom * 1.25)"
              >
                <MapIcon name="plus" />
              </button>
              <button type="button" class="amami-map-fit" aria-label="恢复全图" title="恢复全图" @click="resetView">
                <MapIcon name="fit" />
              </button>
            </div>
          </footer>
        </section>
        <div
          class="amami-map-shortcuts"
          :class="{ 'is-following-open': followedPeopleOpen, 'is-places-open': quickPlacesOpen }"
        >
          <CampusQuickPlaces
            v-model:open="quickPlacesOpen"
            :locations="quickLocations"
            :selected-id="selectedId"
            :persistent="quickPlacesPersistent"
            :picture-for="locationPicture"
            @select="openQuickPlace"
            @remove="removeQuickPlace"
            @browse="browseForQuickPlace"
            @image-error="onSceneImageError"
          />
          <CampusFollowedPeople
            v-model:open="followedPeopleOpen"
            :people="followedPeople"
            :selected-name="followFocusName"
            :filter-region="followFilterRegion"
            @select="openFollowedPerson"
            @remove="unfollowPerson"
            @browse="browseForFollowedPerson"
            @clear-filter="followFilterRegion = null"
          />
        </div>
        <Transition name="amami-map-panel">
          <aside
            v-show="directoryOpen"
            :id="directoryId"
            class="amami-map-directory"
            :class="{ 'is-detail': showingDetail }"
            aria-label="校园地点目录"
          >
            <header class="amami-map-directory-header">
              <template v-if="showingDetail">
                <button type="button" class="amami-map-directory-back" @click="goBack">
                  <MapIcon name="back" />{{ backLabel }}
                </button>
                <span class="amami-map-directory-caption">{{ selectedLocation ? '地点详情' : '区域导览' }}</span>
                <button type="button" class="amami-map-detail-close" aria-label="收起地点详情" @click="toggleDirectory">
                  <MapIcon name="close" />
                </button>
              </template>
              <template v-else>
                <div>
                  <small>CAMPUS DIRECTORY</small>
                  <h3>
                    区域导览<span class="amami-map-directory-count">{{ campusLocations.length }} 地点</span>
                  </h3>
                </div>
                <button type="button" class="amami-map-panel-close" aria-label="收起地点目录" @click="toggleDirectory">
                  <MapIcon name="close" />
                </button>
              </template>
            </header>
            <Transition name="amami-map-page" mode="out-in" @enter="onPageEnter">
              <div v-if="!showingDetail" key="directory" class="amami-map-directory-page">
                <div class="amami-map-search">
                  <label :for="searchId" class="amami-map-sr-only">寻找地点</label>
                  <div>
                    <MapIcon name="search" /><input
                      :id="searchId"
                      v-model="query"
                      type="search"
                      placeholder="搜索建筑、教室或社团…"
                    /><button v-if="query" type="button" aria-label="清空搜索" @click="query = ''">
                      <MapIcon name="close" />
                    </button>
                  </div>
                </div>
                <nav
                  class="amami-map-categories"
                  :style="{ '--category-index': ['全部', ...campusCategories].indexOf(activeCategory) }"
                  aria-label="地点分类"
                >
                  <span class="amami-map-category-indicator" aria-hidden="true"></span>
                  <button
                    v-for="category in ['全部', ...campusCategories]"
                    :key="category"
                    type="button"
                    :aria-pressed="activeCategory === category"
                    @click="activeCategory = category"
                  >
                    {{ category }}
                  </button>
                </nav>
                <div class="amami-map-results-summary" role="status">
                  {{ query.trim() ? '搜索结果' : activeCategory === '全部' ? '全部区域' : `${activeCategory}区域` }}
                  <span>{{ locationGroups.length }} 区域 / {{ filteredLocations.length }} 地点</span>
                </div>
                <div ref="results" class="amami-map-results" :class="{ 'is-browsing': !isFiltering }">
                  <template v-if="filteredLocations.length">
                    <section
                      v-for="(group, index) in locationGroups"
                      :key="group.region.id"
                      class="amami-map-location-group"
                      :class="{ 'is-browsing': !isFiltering }"
                      :style="{ '--item-index': Math.min(index, 6) }"
                      :aria-label="group.region.name"
                    >
                      <button
                        type="button"
                        class="amami-map-group-heading"
                        :data-directory-region="group.region.id"
                        :aria-label="`查看${group.region.name}`"
                        @pointerenter="hoveredId = group.region.id"
                        @pointerleave="hoveredId = null"
                        @click="selectRegion(group.region, false, true)"
                      >
                        <span class="amami-map-group-thumbnail">
                          <img
                            v-if="regionPicture(group.region.id)"
                            :src="regionPicture(group.region.id)?.url"
                            :alt="regionPicture(group.region.id)?.caption"
                            :data-scene-id="campusRegionScenes[group.region.id]"
                            loading="lazy"
                            decoding="async"
                            @error="onSceneImageError"
                          />
                          <svg
                            v-else-if="artwork"
                            :viewBox="thumbnailFrames[group.region.id] ?? '0 0 1672 941'"
                            preserveAspectRatio="xMidYMid slice"
                            aria-hidden="true"
                          >
                            <use :href="`#${artworkId}`" />
                          </svg>
                          <span class="amami-map-group-index">{{
                            String(campusRegions.indexOf(group.region) + 1).padStart(2, '0')
                          }}</span>
                        </span>
                        <span class="amami-map-group-title"
                          ><small
                            >{{ group.region.category }}<span>{{ group.locations.length }} 个地点</span></small
                          ><strong>{{ group.region.name }}</strong
                          ><span class="amami-map-group-caption">{{
                            group.region.buildings
                              .map(building => building.name)
                              .slice(0, 2)
                              .join(' · ')
                          }}</span></span
                        >
                        <MapIcon name="chevron" />
                      </button>
                      <button
                        v-for="item in isFiltering ? group.locations : []"
                        :key="item.id"
                        type="button"
                        class="amami-map-result"
                        :data-location-id="item.id"
                        :class="{
                          'is-selected': selectedId === item.id,
                          'is-current': currentPlace?.location?.id === item.id,
                        }"
                        :aria-pressed="selectedId === item.id"
                        @pointerenter="hoveredId = item.region.id"
                        @pointerleave="hoveredId = null"
                        @click="selectLocation(item, true, true)"
                      >
                        <span class="amami-map-result-number">{{ String(item.id).padStart(2, '0') }}</span>
                        <strong>{{ item.name }}</strong>
                        <span v-if="currentPlace?.location?.id === item.id" class="amami-map-result-here">当前</span>
                        <MapIcon :name="selectedId === item.id ? 'check' : 'chevron'" />
                      </button>
                    </section>
                  </template>
                  <div v-else class="amami-map-empty">
                    <MapIcon name="search" />
                    <strong>没有找到这个地点</strong>
                    <p>试试“神社”“教学楼”或“宿舍”。</p>
                    <button
                      type="button"
                      @click="
                        query = '';
                        activeCategory = '全部';
                      "
                    >
                      查看全部地点
                    </button>
                  </div>
                </div>
              </div>
              <section
                v-else-if="selectedRegion"
                :key="`${selectedRegion.id}-${selectedId ?? 'region'}`"
                ref="detail"
                class="amami-map-detail"
                :class="{ 'is-location': !!selectedLocation }"
              >
                <div class="amami-map-region-banner">
                  <span class="amami-map-region-code" aria-hidden="true">{{ regionNumber(selectedRegion) }}</span>
                  <div class="amami-map-region-heading">
                    <small>AREA {{ regionNumber(selectedRegion) }} / {{ selectedRegion.category }}</small>
                    <h3>{{ selectedRegion.name }}</h3>
                  </div>
                  <span class="amami-map-region-count">{{ regionLocations.length }} 处地点</span>
                </div>
                <div v-if="selectedLocation" class="amami-map-detail-identity">
                  <small><MapIcon name="pin" />{{ selectedLocation.landmark.name }}</small>
                  <h3>{{ selectedLocation.name }}</h3>
                  <span v-if="currentPlace?.location?.id === selectedId" class="amami-map-here"><i></i>当前位置</span>
                </div>
                <div
                  v-if="selectedPicture || selectedMapRegion"
                  class="amami-map-detail-visual"
                  :class="{ 'has-scene': !!selectedPicture }"
                >
                  <img
                    v-if="selectedPicture"
                    :key="selectedPicture.id"
                    :src="selectedPicture.url"
                    :alt="selectedPicture.caption"
                    :data-scene-id="selectedPicture.id"
                    decoding="async"
                    @error="onSceneImageError"
                  />
                  <svg
                    v-else-if="artwork"
                    :viewBox="previewFrame"
                    preserveAspectRatio="xMidYMid slice"
                    aria-hidden="true"
                  >
                    <defs>
                      <mask
                        :id="`${spotlightId}-preview`"
                        maskUnits="userSpaceOnUse"
                        x="0"
                        y="0"
                        width="1672"
                        height="941"
                      >
                        <rect width="1672" height="941" fill="white" />
                        <path
                          v-for="(outline, index) in selectedLocation
                            ? [selectedLocation.landmark.outline]
                            : selectedRegion.outlines"
                          :key="index"
                          :d="outline"
                          fill="black"
                          fill-rule="nonzero"
                        />
                      </mask>
                    </defs>
                    <image :href="artwork" width="1672" height="941" />
                    <rect
                      width="1672"
                      height="941"
                      fill="#102f49"
                      opacity="0.22"
                      :mask="`url(#${spotlightId}-preview)`"
                    />
                  </svg>
                  <span class="amami-map-detail-category">{{
                    selectedLocation?.landmark.category ?? selectedRegion.category
                  }}</span>
                </div>
                <span v-if="selectedPicture || selectedMapRegion" class="amami-map-preview-caption">{{
                  selectedPicture?.caption ??
                  (selectedLocation ? `地图示意 · ${selectedLocation.landmark.name}` : '区域示意')
                }}</span>
                <CampusRegionPlaces
                  v-if="!selectedLocation"
                  :region-id="selectedRegion.id"
                  :period="schedulePeriod"
                  :focus-person="followFocusName"
                  :focus-place="followFocusPlace"
                  @open-location="openEncounterLocation"
                />
                <div v-if="!selectedLocation" class="amami-map-detail-identity">
                  <p class="amami-map-region-description">{{ selectedRegion.description }}</p>
                </div>
                <button
                  v-if="selectedLocation"
                  type="button"
                  class="amami-map-depart"
                  @click="openDestinationTravel(selectedLocation.id, $event)"
                >
                  <MapIcon name="pin" />前往这里<MapIcon name="chevron" />
                </button>
                <div class="amami-map-detail-actions" :class="{ 'has-quick-action': !!selectedLocation }">
                  <button
                    v-if="selectedMapRegion"
                    type="button"
                    class="amami-map-detail-locate"
                    @click="focusRegion(selectedMapRegion)"
                  >
                    <MapIcon name="target" />{{ selectedLocation ? '地图定位' : '在地图中定位' }}
                    <MapIcon v-if="!selectedLocation" name="chevron" />
                  </button>
                  <button
                    v-if="selectedLocation"
                    type="button"
                    class="amami-map-save-toggle"
                    :aria-pressed="selectedIsQuickPlace"
                    :title="selectedIsQuickPlace ? '点击取消快捷收藏' : '收藏后可从地图左侧直接打开'"
                    @click="toggleSelectedQuickPlace"
                  >
                    <MapIcon name="bookmark" />{{ selectedIsQuickPlace ? '已加入快捷地点' : '加入快捷地点' }}
                  </button>
                </div>
                <p v-if="!selectedMapRegion" class="amami-map-interior">地图位置待确认</p>
                <CampusRegionCharacters
                  v-if="selectedLocation"
                  :region-id="selectedRegion.id"
                  :location-id="selectedLocation?.id"
                  :period="schedulePeriod"
                  :focus-person="followFocusName"
                  @open-location="openEncounterLocation"
                />
                <dl v-if="selectedLocation" class="amami-map-detail-info">
                  <div>
                    <dt>环境</dt>
                    <dd>{{ selectedLocation.appearance }}</dd>
                  </div>
                  <div>
                    <dt>用途</dt>
                    <dd>{{ selectedLocation.purpose }}</dd>
                  </div>
                </dl>
                <p v-if="selectedLocation?.mapNote || selectedRegion.category === '地下'" class="amami-map-interior">
                  {{ selectedLocation?.mapNote ?? '地下地点以入口定位' }}
                </p>
                <details v-if="selectedLocation" :key="selectedId ?? 'region-list'" class="amami-map-sublocations">
                  <summary>
                    {{ selectedLocation ? '同一区域的地点' : '区域内地点' }} <span>{{ regionLocations.length }}</span>
                    <MapIcon name="chevron" />
                  </summary>
                  <button
                    v-for="item in regionLocations"
                    :key="item.id"
                    type="button"
                    :aria-pressed="selectedId === item.id"
                    @click="selectLocation(item)"
                  >
                    <span>{{ String(item.id).padStart(2, '0') }}</span
                    ><strong>{{ item.name }}</strong
                    ><MapIcon :name="selectedId === item.id ? 'check' : 'chevron'" />
                  </button>
                </details>
              </section>
            </Transition>
          </aside>
        </Transition>
      </div>
      <Transition name="amami-travel">
        <CampusTravelDialog
          v-if="travelDestination"
          :key="travelDestination.key"
          :destination="travelDestination"
          :period="schedulePeriod"
          :picture="travelPicture?.url"
          :followed-names="followedNames"
          :busy="travelBusy"
          :error="travelError"
          @cancel="cancelTravel"
          @confirm="confirmTravel"
          @change="travelError = ''"
        />
      </Transition>
    </dialog>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import MapIcon from './MapIcon.vue';
import CampusQuickPlaces from './CampusQuickPlaces.vue';
import CampusRegionCharacters from './CampusRegionCharacters.vue';
import CampusRegionPlaces from './CampusRegionPlaces.vue';
import CampusFollowedPeople from './CampusFollowedPeople.vue';
import CampusFollowMarkers from './CampusFollowMarkers.vue';
import CampusTravelDialog from './CampusTravelDialog.vue';
import { getCampusTravelDestination, getCampusTravelCandidates } from './campus-travel';
import type { CampusTravelDestination, CampusTravelDraft } from './campus-travel';
import { writeTextToTavernInput, showTavernNotice } from '../mobile/relationship-runtime';
import { useFollowedPeople } from './use-followed-people';
import { getCampusSchedulePeriod } from './campus-character-schedule';
import {
  getCampusFollowedPeople,
  groupCampusFollowedPeople,
  resolveCampusFollowedPerson,
  getCampusFollowMarkerPlacement,
} from './campus-following';
import { useQuickPlaces } from './use-quick-places';
import { campusCategories, campusRegions, campusLocations, resolveCampusLocation } from './campus-map-data';
import type { CampusRegion, CampusLocation } from './campus-map-data';
import { loadCampusMapArtwork } from './campus-map-artwork';
import { loadCampusOceanMask } from './campus-map-ocean';
import { campusSceneAssets, campusRegionScenes, campusLocationScenes } from './campus-map-scenes';
import { useMapCamera } from './use-map-camera';
import type { MapCameraSnapshot } from './use-map-camera';
import campusMapStyles from './campus-map.css?raw';
import campusDirectoryStyles from './campus-map-directory.css?raw';
import campusResponsiveStyles from './campus-map-responsive.css?raw';
import campusQuickPlaceStyles from './campus-map-quick-places.css?raw';
import campusPeopleStyles from './campus-map-people.css?raw';
import campusFollowingStyles from './campus-map-following.css?raw';
import campusTravelStyles from './campus-map-travel.css?raw';

const props = defineProps<{ locationLabel: string; timeLabel: string; frameElement?: HTMLElement | null }>();
function openEncounterLocation(id: number) {
  const place = campusLocations.find(location => location.id === id);
  if (place) selectLocation(place);
}
const emit = defineEmits<{ close: [focusInput?: boolean] }>();
const titleId = `campus-map-${useId()}`;
const searchId = `${titleId}-search`;
const directoryId = `${titleId}-directory`;
const spotlightId = `${titleId}-spotlight`;
const artworkId = `${titleId}-artwork`;
const portalAnchor = ref<HTMLElement | null>(null);
const portalTarget = ref<HTMLElement | null>(null);
const dialog = ref<HTMLDialogElement | null>(null);
const viewport = ref<HTMLElement | null>(null);
const results = ref<HTMLElement | null>(null);
const detail = ref<HTMLElement | null>(null);
const artwork = ref('');
const oceanMask = ref('');
const failedSceneIds = ref<string[]>([]);
const loading = ref(true);
const loadError = ref('');
const query = ref('');
const activeCategory = ref('全部');
const selectedId = ref<number | null>(null);
const selectedRegionId = ref<string | null>(null);
const directoryView = ref<'directory' | 'detail'>('directory');
const directoryOpen = ref(false);
const quickPlacesOpen = ref(false);
const followedPeopleOpen = ref(false);
const followFilterRegion = ref<string | null>(null);
const followFocusName = ref<string | null>(null);
const followFocusPlace = ref<string | null>(null);
const travelDestination = ref<CampusTravelDestination | null>(null);
const travelReturnFocus = ref<HTMLElement | null>(null);
const travelBusy = ref(false);
const travelError = ref('');
const travelPicture = computed(() => {
  const target = travelDestination.value;
  if (!target) return null;
  return target.locationId !== undefined ? locationPicture(target.locationId) : regionPicture(target.regionId);
});
const { names: followedNames, remove: unfollowPerson } = useFollowedPeople();
const schedulePeriod = computed(() => getCampusSchedulePeriod(props.timeLabel));
const followedPeople = computed(() => getCampusFollowedPeople(followedNames.value, schedulePeriod.value));
const followedGroups = computed(() => groupCampusFollowedPeople(followedPeople.value));
watch(followedGroups, groups => {
  if (followFilterRegion.value && !groups.some(group => group.region.id === followFilterRegion.value)) {
    followFilterRegion.value = null;
  }
});
const followedRegionIds = computed(() => new Set(followedGroups.value.map(group => group.region.id)));
watch(quickPlacesOpen, open => {
  if (open) followedPeopleOpen.value = false;
});
watch(followedPeopleOpen, open => {
  if (open) quickPlacesOpen.value = false;
  else followFilterRegion.value = null;
});
const quickPlaceAnnouncement = ref('');
const {
  ids: quickPlaceIds,
  persistent: quickPlacesPersistent,
  toggle: toggleQuickPlace,
  remove: forgetQuickPlace,
} = useQuickPlaces();
const quickLocations = computed(() =>
  quickPlaceIds.value.flatMap(id => campusLocations.find(place => place.id === id) ?? []),
);
const selectedIsQuickPlace = computed(
  () => selectedId.value !== null && quickPlaceIds.value.includes(selectedId.value),
);
const previewFrame = ref('0 0 1672 941');
const thumbnailFrames = ref<Record<string, string>>({});
const showLabels = ref(false);
const hoveredId = ref<string | null>(null);
const focusedRegionId = ref<string | null>(null);
const reducedMotion = ref(false);
const closing = ref(false);
const selectionPulse = ref(0);
const frameStyle = ref<Record<string, string>>({});
const dragging = ref(false);
const camera = useMapCamera({ viewport, reducedMotion, getSafeInset });
const { zoom, viewportSize, boardStyle, overviewZoom, moving, zoomAt } = camera;
const followedMarkerPlacements = computed(() =>
  Object.fromEntries(
    followedGroups.value.map(group => [
      group.region.id,
      getCampusFollowMarkerPlacement(
        group.region,
        {
          ...viewportSize.value,
          boardTop: parseFloat(boardStyle.value.top),
          boardLeft: parseFloat(boardStyle.value.left),
          boardWidth: parseFloat(boardStyle.value.width),
          boardHeight: parseFloat(boardStyle.value.height),
        },
        group.people.length,
      ),
    ]),
  ),
);
const followedMarkersBelow = computed(
  () =>
    new Set(
      followedGroups.value
        .filter(group => followedMarkerPlacements.value[group.region.id].below)
        .map(group => group.region.id),
    ),
);
let disposed = false;
let portalHost: HTMLElement | null = null;
let observer: ResizeObserver | null = null;
let frameObserver: ResizeObserver | null = null;
let frameMutationObserver: MutationObserver | null = null;
let stopFrameTracking: (() => void) | null = null;
let scrollDocument: Document | null = null;
let previousOverflow = '';
let moved = false;
let directoryScrollTop = 0;
let directoryReturnCamera: MapCameraSnapshot | null = null;
let regionReturnCamera: MapCameraSnapshot | null = null;
let regionScrollTop = 0;
let pendingDetailScroll = 0;
let directoryFocusSelector = '.amami-map-search input';
const locationOrigin = ref<'region' | 'directory'>('region');
let restoreDirectoryFocus = false;
let closeTimer: ReturnType<typeof setTimeout> | undefined;
let motionPreference: MediaQueryList | null = null;
const pointers = new Map<number, { x: number; y: number }>();

const currentPlace = computed(() => resolveCampusLocation(props.locationLabel));
const currentMapAnchor = computed(() => {
  const current = currentPlace.value;
  return current ? (current.landmark ? current.landmark.anchor : current.region.anchor) : null;
});
const selectedLocation = computed(() => campusLocations.find(item => item.id === selectedId.value) ?? null);
const selectedRegion = computed(() => campusRegions.find(item => item.id === selectedRegionId.value) ?? null);
const selectedMapRegion = computed(() =>
  selectedLocation.value?.landmark.anchor === null ? null : selectedRegion.value,
);
const selectedPicture = computed(() =>
  pictureFor(
    selectedLocation.value
      ? campusLocationScenes[selectedLocation.value.id]
      : selectedRegion.value
        ? campusRegionScenes[selectedRegion.value.id]
        : undefined,
  ),
);
const showingDetail = computed(() => !!selectedRegion.value && directoryView.value === 'detail');
const backLabel = computed(() =>
  selectedLocation.value && locationOrigin.value === 'region'
    ? '返回区域'
    : isFiltering.value
      ? '返回筛选结果'
      : '区域目录',
);
const emphasizedRegion = computed(() => {
  if (selectedLocation.value?.landmark.anchor === null) return null;
  return (
    selectedMapRegion.value ??
    campusRegions.find(item => item.id === (hoveredId.value ?? focusedRegionId.value)) ??
    null
  );
});
const isFiltering = computed(() => !!query.value.trim() || activeCategory.value !== '全部');
const selectionAnnouncement = computed(() =>
  selectedRegion.value
    ? `已选择${selectedLocation.value?.name ?? selectedRegion.value.name}，所在区域有${selectedRegion.value.destinations.length}个地点`
    : '校园地图，可选择区域探索',
);
// Broad landscape areas sit behind precise building silhouettes in the hit layer.
const interactiveRegions = [...campusRegions].sort(
  (left, right) => Number(['mountain', 'beach'].includes(right.id)) - Number(['mountain', 'beach'].includes(left.id)),
);
const regionLocations = computed(() => campusLocations.filter(item => item.region.id === selectedRegion.value?.id));
const filteredLocations = computed(() => {
  const key = query.value.normalize('NFKC').trim().toLowerCase().replace(/\s/g, '');
  return campusLocations.filter(
    item =>
      (activeCategory.value === '全部' || item.landmark.category === activeCategory.value) &&
      (!key ||
        [item.name, item.landmark.name, ...item.landmark.aliases, item.region.name]
          .join('')
          .toLowerCase()
          .replace(/\s/g, '')
          .includes(key)),
  );
});
const locationGroups = computed(() => {
  const groups = new Map<string, { region: CampusRegion; locations: CampusLocation[] }>();
  for (const location of filteredLocations.value) {
    const existing = groups.get(location.region.id);
    if (existing) existing.locations.push(location);
    else groups.set(location.region.id, { region: location.region, locations: [location] });
  }
  return campusRegions.flatMap(region => {
    const group = groups.get(region.id);
    return group ? [group] : [];
  });
});
const visibleLabels = computed(() =>
  campusRegions.filter(
    item => showLabels.value || item.id === emphasizedRegion.value?.id || item.id === focusedRegionId.value,
  ),
);
const oceanStyle = computed(() => ({
  '--map-ocean-top': boardStyle.value.top,
  '--map-ocean-bottom': `${parseFloat(boardStyle.value.top) + parseFloat(boardStyle.value.height)}px`,
}));

function getSafeInset() {
  if (!directoryOpen.value || viewportSize.value.width <= 700) return 0;
  const body = dialog.value?.querySelector('.amami-map-body');
  const style = body && dialog.value?.ownerDocument.defaultView?.getComputedStyle(body);
  return style
    ? parseFloat(style.getPropertyValue('--map-panel-width')) +
        2 * parseFloat(style.getPropertyValue('--map-panel-gap'))
    : 368;
}
function anchorStyle(place: CampusRegion) {
  return { left: `${(place.anchor[0] / 1672) * 100}%`, top: `${(place.anchor[1] / 941) * 100}%` };
}
function regionNumber(place: CampusRegion) {
  return String(campusRegions.indexOf(place) + 1).padStart(2, '0');
}
function pictureFor(id?: string) {
  if (!id || failedSceneIds.value.includes(id)) return null;
  const asset = campusSceneAssets[id];
  const url = asset?.url;
  return asset && url ? { id, ...asset, url } : null;
}
function regionPicture(id: string) {
  return pictureFor(campusRegionScenes[id]);
}
function locationPicture(id: number) {
  return pictureFor(campusLocationScenes[id]);
}
function openDestinationTravel(id: number, event: MouseEvent) {
  const destination = getCampusTravelDestination(id);
  if (!destination) return;
  travelReturnFocus.value = (event?.currentTarget ??
    (dialog.value?.getRootNode() as ShadowRoot | undefined)?.activeElement) as HTMLElement | null;
  camera.cancel();
  travelError.value = '';
  travelDestination.value = destination;
}
function cancelTravel() {
  if (travelBusy.value) return;
  travelDestination.value = null;
  travelError.value = '';
  nextTick(() => {
    if (travelReturnFocus.value?.isConnected) travelReturnFocus.value.focus({ preventScroll: true });
    travelReturnFocus.value = null;
  });
}
function confirmTravel(draft: CampusTravelDraft) {
  if (travelBusy.value || !travelDestination.value) return;
  const candidates = getCampusTravelCandidates(travelDestination.value, schedulePeriod.value);
  if (
    draft.destination.key !== travelDestination.value.key ||
    draft.period !== schedulePeriod.value ||
    (draft.personName !== null && !candidates.some(entry => entry.person.name === draft.personName))
  ) {
    travelError.value = '人物位置已经变化，请重新选择。';
    return;
  }
  travelBusy.value = true;
  try {
    if (!writeTextToTavernInput(draft.text)) {
      travelError.value = '未找到酒馆输入框，请回到酒馆后重试。';
      travelBusy.value = false;
      return;
    }
    showTavernNotice('前往行动已填入输入框。', '地图行动', 'success');
    emit('close', true);
  } catch {
    travelError.value = '暂时无法填入行动，请重试。';
    travelBusy.value = false;
  }
}
function toggleSelectedQuickPlace() {
  if (!selectedLocation.value) return;
  const added = toggleQuickPlace(selectedLocation.value.id);
  quickPlaceAnnouncement.value = `${selectedLocation.value.name}${added ? '已加入快捷地点' : '已取消快捷收藏'}`;
}
function removeQuickPlace(id: number) {
  forgetQuickPlace(id);
  quickPlaceAnnouncement.value = `${campusLocations.find(place => place.id === id)?.name ?? '地点'}已取消快捷收藏`;
}
async function openQuickPlace(place: CampusLocation) {
  quickPlacesOpen.value = false;
  hoveredId.value = null;
  selectLocation(place, true, true);
  await nextTick();
  dialog.value?.querySelector<HTMLElement>('.amami-map-directory-back')?.focus({ preventScroll: true });
}
async function browseForQuickPlace() {
  quickPlacesOpen.value = false;
  query.value = '';
  activeCategory.value = '全部';
  directoryOpen.value = true;
  await clearSelection();
  restoreDirectoryFocus = true;
  dialog.value?.querySelector<HTMLElement>('.amami-map-search input')?.focus({ preventScroll: true });
}
function handleCancel() {
  if (travelDestination.value) {
    cancelTravel();
    return;
  }
  if (followedPeopleOpen.value) {
    followedPeopleOpen.value = false;
    nextTick(() => dialog.value?.querySelector<HTMLElement>('.amami-map-follow-tab')?.focus({ preventScroll: true }));
    return;
  }
  if (!quickPlacesOpen.value) return requestClose();
  quickPlacesOpen.value = false;
  nextTick(() => dialog.value?.querySelector<HTMLElement>('.amami-map-quick-tab')?.focus({ preventScroll: true }));
}
function openFollowGroup(regionId: string) {
  followFilterRegion.value = regionId;
  followedPeopleOpen.value = true;
}
async function browseForFollowedPerson() {
  followedPeopleOpen.value = false;
  await browseForQuickPlace();
}
async function openFollowedPerson(name: string) {
  const target = resolveCampusFollowedPerson(name, schedulePeriod.value);
  if (!target) return;
  followedPeopleOpen.value = false;
  followFocusName.value = null;
  await nextTick();
  if (target.locationId !== undefined) {
    const place = campusLocations.find(location => location.id === target.locationId);
    if (place) selectLocation(place, true, true);
  } else selectRegion(target.region);
  followFocusName.value = name;
  followFocusPlace.value = target.unmappedPlace ?? null;
  await nextTick();
  revealFollowedPerson();
}
function revealFollowedPerson() {
  const card = Array.from(
    dialog.value?.querySelectorAll<HTMLButtonElement>('.amami-map-person[data-person-name]') ?? [],
  ).find(button => button.dataset.personName === followFocusName.value);
  const scroller = card?.closest<HTMLElement>('.amami-map-detail');
  if (!card || !scroller) return;
  const offset = card.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  scroller.scrollTop += offset - 18;
  card.focus({ preventScroll: true });
}
function onSceneImageError(event: Event) {
  const id = (event.currentTarget as HTMLImageElement).dataset.sceneId;
  if (id && !failedSceneIds.value.includes(id)) failedSceneIds.value.push(id);
}
function syncMotionPreference() {
  reducedMotion.value = motionPreference?.matches ?? false;
}
function requestClose() {
  if (travelDestination.value) {
    cancelTravel();
    return;
  }
  if (closing.value) return;
  camera.cancel();
  closing.value = true;
  if (reducedMotion.value) emit('close');
  else closeTimer = setTimeout(() => emit('close'), 180);
}

function fitRegionFrame(
  bounds: { x: number; y: number; width: number; height: number },
  ratio: number,
  padding: number,
) {
  const height = Math.max(bounds.height + padding, (bounds.width + padding) / ratio);
  const width = height * ratio;
  return `${bounds.x + bounds.width / 2 - width / 2} ${bounds.y + bounds.height / 2 - height / 2} ${width} ${height}`;
}

// Measure the complete group so every member is visible in its thumbnail.
watch(artwork, async value => {
  if (!value) return;
  await nextTick();
  const frames: Record<string, string> = {};
  dialog.value?.querySelectorAll<SVGGElement>('.amami-map-landmark').forEach(group => {
    const id = group.dataset.regionId;
    if (id) frames[id] = fitRegionFrame(group.getBBox(), 4 / 3, 32);
  });
  thumbnailFrames.value = frames;
});

// The preview and spotlight use the same union of buildings and their grounds.
watch([selectedRegion, selectedLocation, artwork], async () => {
  await nextTick();
  if (!selectedMapRegion.value) return;
  const group = dialog.value?.querySelector<SVGGraphicsElement>(
    selectedLocation.value ? '.amami-map-preview-measure' : '.amami-map-landmark.is-selected',
  );
  if (!group) return;
  previewFrame.value = fitRegionFrame(group.getBBox(), selectedLocation.value ? 16 / 5.6 : 16 / 8.8, 52);
});

watch(showingDetail, next => {
  const focused = (dialog.value?.getRootNode() as ShadowRoot | undefined)?.activeElement;
  restoreDirectoryFocus = !!focused?.matches(
    '.amami-map-result, .amami-map-group-heading, .amami-map-directory-back, .amami-map-detail-close, .amami-map-clear',
  );
  if (next) directoryScrollTop = results.value?.scrollTop ?? directoryScrollTop;
});
function onPageEnter(element: Element) {
  const scroller = showingDetail.value ? element : element.querySelector('.amami-map-results');
  if (scroller) scroller.scrollTop = showingDetail.value ? pendingDetailScroll : directoryScrollTop;
  if (showingDetail.value && followFocusName.value) {
    restoreDirectoryFocus = false;
    nextTick(revealFollowedPerson);
    return;
  }
  if (!restoreDirectoryFocus) return;
  const active = (dialog.value?.getRootNode() as ShadowRoot | undefined)?.activeElement;
  if (
    active &&
    active !== dialog.value &&
    !active.matches(
      '.amami-map-result, .amami-map-group-heading, .amami-map-directory-back, .amami-map-detail-close, .amami-map-clear, .amami-map-sublocations button, .amami-map-person-place, .amami-map-place-card',
    )
  ) {
    restoreDirectoryFocus = false;
    return;
  }
  const target = showingDetail.value
    ? dialog.value?.querySelector<HTMLElement>('.amami-map-directory-back')
    : directoryOpen.value
      ? (dialog.value?.querySelector<HTMLElement>(directoryFocusSelector) ??
        dialog.value?.querySelector<HTMLElement>('.amami-map-search input'))
      : viewport.value;
  target?.focus({ preventScroll: true });
  restoreDirectoryFocus = false;
}
watch([query, activeCategory], () => {
  directoryScrollTop = 0;
  if (results.value) results.value.scrollTop = 0;
});

async function loadArtwork() {
  loading.value = true;
  loadError.value = '';
  try {
    const result = await loadCampusMapArtwork();
    const mask = await loadCampusOceanMask(result);
    if (!disposed) {
      artwork.value = result;
      oceanMask.value = mask;
    }
  } catch (error) {
    if (!disposed) loadError.value = error instanceof Error ? error.message : '请重试或重新打开地图。';
  } finally {
    if (!disposed) loading.value = false;
  }
}
function resetView() {
  camera.resetView();
}
async function toggleDirectory() {
  directoryOpen.value = !directoryOpen.value;
  await nextTick();
  camera.resize();
  if (selectedMapRegion.value) focusRegion(selectedMapRegion.value);
  else resetView();
  if (!directoryOpen.value) {
    nextTick(() =>
      dialog.value?.querySelector<HTMLElement>('.amami-map-directory-toggle')?.focus({ preventScroll: true }),
    );
  }
}
function focusRegion(place: CampusRegion) {
  camera.resize();
  const group = dialog.value?.querySelector<SVGGElement>(`[data-region-id="${place.id}"]`);
  if (!group) return;
  camera.focusBounds(group.getBBox());
  selectionPulse.value++;
}
function captureDirectoryContext() {
  if (showingDetail.value) return;
  directoryReturnCamera = camera.captureView();
  directoryScrollTop = results.value?.scrollTop ?? directoryScrollTop;
  const active = (dialog.value?.getRootNode() as ShadowRoot | undefined)?.activeElement as HTMLElement | null;
  directoryFocusSelector = active?.dataset.locationId
    ? `[data-location-id="${active.dataset.locationId}"]`
    : active?.dataset.directoryRegion
      ? `[data-directory-region="${active.dataset.directoryRegion}"]`
      : '.amami-map-search input';
}
function selectRegion(place: CampusRegion, pointerAction = false, focus = true) {
  if (pointerAction && moved) return;
  followFocusName.value = null;
  followFocusPlace.value = null;
  captureDirectoryContext();
  regionReturnCamera = null;
  pendingDetailScroll = 0;
  locationOrigin.value = 'region';
  selectedRegionId.value = place.id;
  selectedId.value = null;
  directoryView.value = 'detail';
  directoryOpen.value = true;
  if (focus) nextTick(() => focusRegion(place));
}
function selectLocation(location: CampusLocation, focus = false, fromDirectory = false) {
  followFocusName.value = null;
  followFocusPlace.value = null;
  captureDirectoryContext();
  if (fromDirectory || !showingDetail.value) locationOrigin.value = 'directory';
  else if (!selectedLocation.value) {
    locationOrigin.value = 'region';
    regionReturnCamera = camera.captureView();
    regionScrollTop = detail.value?.scrollTop ?? 0;
  }
  pendingDetailScroll = 0;
  const active = (dialog.value?.getRootNode() as ShadowRoot | undefined)?.activeElement;
  if (active?.closest('.amami-map-detail')) restoreDirectoryFocus = true;
  selectedRegionId.value = location.region.id;
  selectedId.value = location.id;
  directoryView.value = 'detail';
  directoryOpen.value = true;
  if (focus && location.landmark.anchor) nextTick(() => focusRegion(location.region));
}
async function clearSelection() {
  followFocusName.value = null;
  followFocusPlace.value = null;
  selectedRegionId.value = null;
  selectedId.value = null;
  hoveredId.value = null;
  focusedRegionId.value = null;
  directoryView.value = 'directory';
  await nextTick();
  if (selectedRegionId.value) return;
  camera.resize();
  if (directoryReturnCamera) camera.restoreView(directoryReturnCamera);
  else resetView();
}
async function goBack() {
  followFocusName.value = null;
  followFocusPlace.value = null;
  if (!selectedLocation.value || locationOrigin.value === 'directory') {
    void clearSelection();
    return;
  }
  selectedId.value = null;
  pendingDetailScroll = regionScrollTop;
  restoreDirectoryFocus = true;
  await nextTick();
  if (regionReturnCamera) camera.restoreView(regionReturnCamera);
}
function clearSelectionFromCanvas(event: MouseEvent) {
  if (moved) return;
  const target = event.target as Element | null;
  if (target === viewport.value || target?.matches('.amami-map-hit-layer, .amami-map-artboard')) clearSelection();
}
function locateCurrent() {
  const current = currentPlace.value;
  if (!current || !currentMapAnchor.value) return;
  if (current.location) selectLocation(current.location, true, true);
  else selectRegion(current.region);
}
function handleWheel(event: WheelEvent) {
  zoomAt(
    zoom.value * Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.0025),
    event.clientX,
    event.clientY,
    false,
  );
}
function pointerDown(event: PointerEvent) {
  if (event.button !== 0 || loading.value) return;
  camera.cancel();
  if (pointers.size === 0) moved = false;
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
}
function pointerMove(event: PointerEvent) {
  const previous = pointers.get(event.pointerId);
  if (!previous) return;
  const other = [...pointers.entries()].find(([id]) => id !== event.pointerId)?.[1];
  const dx = event.clientX - previous.x,
    dy = event.clientY - previous.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) moved = true;
  if (moved) {
    dragging.value = true;
    viewport.value?.setPointerCapture(event.pointerId);
  }
  if (other) {
    const before = Math.hypot(previous.x - other.x, previous.y - other.y);
    const after = Math.hypot(event.clientX - other.x, event.clientY - other.y);
    if (before > 1)
      zoomAt((zoom.value * after) / before, (other.x + event.clientX) / 2, (other.y + event.clientY) / 2, false);
  } else if (moved) {
    camera.moveBy(dx, dy);
  }
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
}
function pointerUp(event: PointerEvent) {
  pointers.delete(event.pointerId);
  if (viewport.value?.hasPointerCapture(event.pointerId)) viewport.value.releasePointerCapture(event.pointerId);
  if (pointers.size === 0) dragging.value = false;
}
function handleKeydown(event: KeyboardEvent) {
  if (!(event.target as Element | null)?.closest('.amami-map-viewport')) return;
  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    zoomAt(zoom.value * 1.25);
  } else if (event.key === '-') {
    event.preventDefault();
    zoomAt(zoom.value / 1.25);
  } else if (event.key === '0') {
    event.preventDefault();
    resetView();
  } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    camera.moveBy(
      event.key === 'ArrowLeft' ? 60 : event.key === 'ArrowRight' ? -60 : 0,
      event.key === 'ArrowUp' ? 60 : event.key === 'ArrowDown' ? -60 : 0,
    );
  }
}
function handleBackdropClick(event: MouseEvent) {
  if (event.target !== dialog.value) return;
  const rect = dialog.value?.getBoundingClientRect();
  if (
    rect &&
    (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)
  )
    requestClose();
}

function trackFrontendFrame(targetDocument: Document) {
  const source = props.frameElement;
  const targetWindow = targetDocument.defaultView;
  if (!source || !targetWindow) return () => {};
  let pendingFrame = 0;
  const refresh = () => {
    pendingFrame = 0;
    if (disposed || !source.isConnected) return;
    const rect = source.getBoundingClientRect();
    let left = rect.left,
      top = rect.top,
      width = rect.width,
      height = rect.height;
    let sourceDocument = source.ownerDocument;
    // A parent-document portal still uses the frontend's visual bounds. Account
    // for the iframe's position, border and scale rather than centering in its parent.
    while (sourceDocument !== targetDocument) {
      const sourceWindow = sourceDocument.defaultView;
      const sourceViewport = sourceWindow?.visualViewport;
      const visibleLeft = Math.max(left, sourceViewport?.offsetLeft ?? 0);
      const visibleTop = Math.max(top, sourceViewport?.offsetTop ?? 0);
      const visibleRight = Math.min(
        left + width,
        (sourceViewport?.offsetLeft ?? 0) + (sourceViewport?.width ?? sourceWindow?.innerWidth ?? width),
      );
      const visibleBottom = Math.min(
        top + height,
        (sourceViewport?.offsetTop ?? 0) + (sourceViewport?.height ?? sourceWindow?.innerHeight ?? height),
      );
      left = visibleLeft;
      top = visibleTop;
      width = visibleRight - visibleLeft;
      height = visibleBottom - visibleTop;
      if (width <= 0 || height <= 0) return;
      const frame = sourceWindow?.frameElement as HTMLElement | null;
      if (!frame) return;
      const frameRect = frame.getBoundingClientRect();
      const scaleX = frame.offsetWidth ? frameRect.width / frame.offsetWidth : 1;
      const scaleY = frame.offsetHeight ? frameRect.height / frame.offsetHeight : 1;
      left = frameRect.left + (frame.clientLeft + left) * scaleX;
      top = frameRect.top + (frame.clientTop + top) * scaleY;
      width *= scaleX;
      height *= scaleY;
      sourceDocument = frame.ownerDocument;
    }
    const visualViewport = targetWindow.visualViewport;
    const viewLeft = visualViewport?.offsetLeft ?? 0;
    const viewTop = visualViewport?.offsetTop ?? 0;
    const right = Math.min(left + width, viewLeft + (visualViewport?.width ?? targetWindow.innerWidth));
    const bottom = Math.min(top + height, viewTop + (visualViewport?.height ?? targetWindow.innerHeight));
    left = Math.max(left, viewLeft);
    top = Math.max(top, viewTop);
    width = right - left;
    height = bottom - top;
    if (width <= 0 || height <= 0) return;
    frameStyle.value = {
      inset: 'auto',
      margin: '0',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  };
  const schedule = () => {
    if (!pendingFrame) pendingFrame = targetWindow.requestAnimationFrame(refresh);
  };
  const windows = new Set([source.ownerDocument.defaultView, targetWindow]);
  for (const win of windows) {
    win?.addEventListener('resize', schedule);
    win?.addEventListener('scroll', schedule, true);
    win?.visualViewport?.addEventListener('resize', schedule);
    win?.visualViewport?.addEventListener('scroll', schedule);
  }
  frameObserver = new ResizeObserver(schedule);
  frameObserver.observe(source);
  frameMutationObserver = new MutationObserver(records => {
    if (records.some(record => record.target !== portalHost && !portalHost?.contains(record.target))) schedule();
  });
  for (const doc of new Set([source.ownerDocument, targetDocument])) {
    frameMutationObserver.observe(doc.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden'],
    });
  }
  try {
    const embeddedFrame = source.ownerDocument.defaultView?.frameElement;
    if (embeddedFrame) frameObserver.observe(embeddedFrame);
  } catch {
    /* A cross-origin embed tracks its local frontend and viewport. */
  }
  refresh();
  return () => {
    if (pendingFrame) targetWindow.cancelAnimationFrame(pendingFrame);
    for (const win of windows) {
      win?.removeEventListener('resize', schedule);
      win?.removeEventListener('scroll', schedule, true);
      win?.visualViewport?.removeEventListener('resize', schedule);
      win?.visualViewport?.removeEventListener('scroll', schedule);
    }
  };
}

onMounted(async () => {
  const owner = portalAnchor.value?.ownerDocument ?? document;
  let targetDocument = owner;
  try {
    targetDocument = owner.defaultView?.frameElement?.ownerDocument ?? owner;
  } catch {
    /* Cross-origin embeds retain their local modal. */
  }
  scrollDocument = targetDocument;
  previousOverflow = targetDocument.body.style.overflow;
  portalHost = targetDocument.createElement('div');
  portalHost.className = 'amami-campus-map-portal';
  const shadow = portalHost.attachShadow({ mode: 'open' });
  const style = targetDocument.createElement('style');
  style.textContent = [
    campusMapStyles,
    campusDirectoryStyles,
    campusQuickPlaceStyles,
    campusPeopleStyles,
    campusResponsiveStyles,
    campusFollowingStyles,
    campusTravelStyles,
  ].join('\n');
  shadow.append(style);
  const mount = targetDocument.createElement('div');
  shadow.append(mount);
  targetDocument.body.append(portalHost);
  portalTarget.value = mount;
  targetDocument.body.style.overflow = 'hidden';
  stopFrameTracking = trackFrontendFrame(targetDocument);
  directoryOpen.value = true;
  motionPreference = targetDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)') ?? null;
  syncMotionPreference();
  motionPreference?.addEventListener('change', syncMotionPreference);
  await nextTick();
  if (disposed) return;
  dialog.value?.showModal();
  const refreshSize = () => {
    camera.resize();
    if (selectedMapRegion.value) {
      const group = dialog.value?.querySelector<SVGGElement>(`[data-region-id="${selectedMapRegion.value.id}"]`);
      if (group) camera.focusBounds(group.getBBox(), false);
    } else camera.resetView(false);
  };
  observer = new ResizeObserver(refreshSize);
  if (viewport.value) observer.observe(viewport.value);
  refreshSize();
  void loadArtwork();
});
onBeforeUnmount(() => {
  disposed = true;
  clearTimeout(closeTimer);
  motionPreference?.removeEventListener('change', syncMotionPreference);
  camera.dispose();
  observer?.disconnect();
  frameObserver?.disconnect();
  frameMutationObserver?.disconnect();
  stopFrameTracking?.();
  pointers.clear();
  dialog.value?.close();
  if (scrollDocument) scrollDocument.body.style.overflow = previousOverflow;
  portalHost?.remove();
});
</script>
