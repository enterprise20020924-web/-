<template>
  <section class="admission-device" aria-label="天海学园入学登记平板">
    <span class="admission-device-camera" aria-hidden="true"><i></i><b></b></span>
    <span class="admission-device-buttons" aria-hidden="true"></span>
    <div class="admission-device-screen"><slot /></div>
    <span class="admission-device-home" aria-hidden="true"></span>
  </section>
</template>

<style scoped lang="scss">
:global(body:has(#app > .admission-device)) {
  background: transparent;
}
.admission-device {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: 11px 7px 10px;
  border: 1px solid #7299c4;
  border-radius: 20px;
  background: linear-gradient(135deg, #263f66, #070e2b 28%, #0c193b 76%, #345778);
  box-shadow:
    inset 0 1px 0 #d8fcff99,
    inset 1px 0 0 #88b8d855,
    inset 0 -2px 0 #020718;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 20px;
    right: 20px;
    height: 1px;
    pointer-events: none;
    background: linear-gradient(90deg, transparent, #82edff88 22%, #80a4df33 60%, transparent);
  }
  &::before {
    top: 1px;
  }
  &::after {
    bottom: 1px;
  }
}
.admission-device-screen {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border: 1px solid #020a22;
  border-radius: 12px;
  background: #111bc7;
  box-shadow: 0 0 0 1px #31bedb45;
}
.admission-device-camera {
  position: absolute;
  top: 3px;
  left: 50%;
  display: flex;
  align-items: center;
  gap: 5px;
  transform: translateX(-50%);
  pointer-events: none;

  i {
    box-sizing: border-box;
    width: 5px;
    height: 5px;
    border: 1px solid #52718e;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #79d5e3 0 12%, #17304e 26%, #020715 70%);
  }
  b {
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: #425a77;
  }
}
.admission-device-buttons {
  position: absolute;
  top: 74px;
  right: 1px;
  width: 2px;
  height: 29px;
  border-radius: 2px;
  background: #779dbb;
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 38px;
    width: 2px;
    height: 14px;
    border-radius: inherit;
    background: inherit;
  }
}
.admission-device-home {
  position: absolute;
  bottom: 4px;
  left: 50%;
  width: 38px;
  height: 2px;
  transform: translateX(-50%);
  border-radius: 2px;
  background: #9ccfe080;
  box-shadow: 0 1px 0 #020718;
  pointer-events: none;
}
@media (max-width: 600px) {
  .admission-device {
    padding: 9px 5px 8px;
    border-radius: 15px;
  }
  .admission-device-screen {
    border-radius: 9px;
  }
  .admission-device-camera {
    top: 2px;
  }
  .admission-device-home {
    bottom: 3px;
    width: 30px;
  }
}
</style>
