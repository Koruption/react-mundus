import { EntityBehavior } from '../../lib/entities'

export class MousePositionTracker extends EntityBehavior {
  mouseX!: number
  mouseY!: number

  onStart () {
    window.document.addEventListener('mousemove', (ev: MouseEvent) => {
      this.mouseX = ev.clientX
      this.mouseY = ev.clientY
    })
  }

  update (dt: number) {
    // console.log('MouseX: ' + this.mouseX)
    // console.log('MouseY: ' + this.mouseY)
  }

  onDetached (): void {
    window.document.removeEventListener('mousemove', (ev: MouseEvent) => {
      this.mouseX = ev.clientX
      this.mouseY = ev.clientY
    })
  }
}

export class CameraManager extends EntityBehavior {
  update (dt: number) {
    console.log('Camera Manager Update()')
  }
}
