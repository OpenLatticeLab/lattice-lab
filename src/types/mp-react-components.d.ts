declare module '@materialsproject/mp-react-components' {
  import * as React from 'react'

  export const CrystalToolkitScene: React.ComponentType<{
    data: any
    [key: string]: any
  }>

  // Lightweight typing for Download component (from library sources)
  export const Download: React.ComponentType<{
    id?: string
    data?: {
      filename: string
      content: any
      isBase64?: boolean
      isDataURL?: boolean
      mimeType?: string
    }
    isBase64?: boolean
    isDataURL?: boolean
    mimeType?: string
    [key: string]: any
  }>
}
