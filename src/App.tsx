import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardHeader,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Button,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material'
import { CloudUpload, Send } from '@mui/icons-material'
import { CrystalToolkitScene, Download } from '@materialsproject/mp-react-components'
import { generateFromPrompt, uploadCif, exportFile } from './api'
import type { SceneResponse } from './types'

type Mode = 'prompt' | 'upload'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB

export default function App() {
  const [mode, setMode] = useState<Mode>('upload')
  const [prompt, setPrompt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SceneResponse | null>(null)
  const [visibility, setVisibility] = useState<Record<string, 0 | 1>>({
    atoms: 1,
    bonds: 1,
    unit_cell: 1,
    polyhedra: 1,
    axes: 1,
  })
  // For screenshot/download integration with CrystalToolkitScene
  const [sceneProps, setSceneProps] = useState<any>({
    imageData: undefined,
    imageRequest: undefined,
    imageDataTimestamp: undefined,
    fileType: '',
    fileTimestamp: ''
  })
  const [downloadData, setDownloadData] = useState<any>(undefined)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    document.title = 'Lattice Lab'
  }, [])

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setError(null)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFileSelect(f)
  }

  const handleFileSelect = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.cif')) {
      setError('Only .cif files are accepted')
      setFile(null)
      return
    }
    if (f.size > MAX_FILE_BYTES) {
      setError('File exceeds 10MB limit')
      setFile(null)
      return
    }
    setFile(f)
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a .cif file first')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resp = await uploadCif(file)
      setResult(resp)
    } catch (e: any) {
      setResult(null)
      setError(e?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const resp = await generateFromPrompt(prompt.trim())
      setResult(resp)
    } catch (e: any) {
      setResult(null)
      setError(e?.message || 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const sceneData = useMemo(() => {
    const s: any = result?.scene
    // CrystalToolkitScene expects an object with { name, contents }
    if (s && typeof s === 'object' && 'name' in s && 'contents' in s) return s
    return null
  }, [result])

  // When CrystalToolkitScene produces a PNG screenshot, trigger a download
  useEffect(() => {
    if (sceneProps?.imageData && sceneProps?.imageDataTimestamp) {
      setDownloadData({
        filename: 'crystal',
        content: sceneProps.imageData,
        mimeType: 'image/png',
        isDataURL: true,
      })
    }
  }, [sceneProps?.imageDataTimestamp])

  // When user picks an export option from showExportButton, call backend and download
  useEffect(() => {
    const type: string | undefined = sceneProps?.fileType
    const ts = sceneProps?.fileTimestamp
    if (!type || !ts) return
    const map: Record<string, string> = {
      'CIF (Symmetrized)': 'cif_symm',
      'CIF': 'cif',
      'POSCAR': 'poscar',
      'JSON': 'json',
      'Prismatic': 'prismatic',
      'VASP Input Set (MPRelaxSet)': 'mpr',
    }
    const fmt = map[type]
    if (!fmt) return
    ;(async () => {
      try {
        let cifText: string | undefined
        if (file) {
          try { cifText = await file.text() } catch {}
        }
        const body: any = {}
        if (cifText) body.cif = cifText
        else if (result) body.structure = { lattice: result.lattice, formula: result.formula, n_sites: result.n_sites }
        if (result?.scene) body.scene = result.scene
        const { blob, filename } = await exportFile(fmt, body)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } catch (e: any) {
        console.error('Export failed', e)
        setError(e?.message || 'Export failed')
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneProps?.fileTimestamp])

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">Lattice Lab</Typography>
        </Toolbar>
      </AppBar>
      {loading && <LinearProgress />}
      <Container sx={{ py: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardHeader
                title="Input"
                action={
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={mode}
                    onChange={(_, v) => v && setMode(v)}
                  >
                    <ToggleButton value="prompt">Prompt</ToggleButton>
                    <ToggleButton value="upload">Upload</ToggleButton>
                  </ToggleButtonGroup>
                }
              />
              <CardContent>
                {mode === 'prompt' ? (
                  <Stack gap={2}>
                    <TextField
                      label="Prompt"
                      placeholder="Describe the crystal you want…"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      multiline
                      minRows={6}
                      fullWidth
                    />
                    <Button
                      onClick={handleGenerate}
                      variant="contained"
                      startIcon={<Send />}
                      disabled={loading}
                    >
                      Generate
                    </Button>
                  </Stack>
                ) : (
                  <Stack gap={2}>
                    <input
                      ref={fileInputRef}
                      className="hidden-input"
                      type="file"
                      accept=".cif"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) handleFileSelect(f)
                      }}
                    />
                    <Paper
                      variant="outlined"
                      className="dropzone"
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={onDrop}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ cursor: 'pointer' }}
                    >
                      <Typography variant="body1" gutterBottom>
                        Drag & drop a .cif file here, or click to select
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Max size 10MB. Only .cif files.
                      </Typography>
                    </Paper>
                    {file && (
                      <Alert severity="info">Selected: {file.name} ({formatBytes(file.size)})</Alert>
                    )}
                    <Button
                      onClick={handleUpload}
                      variant="contained"
                      startIcon={<CloudUpload />}
                      disabled={loading || !file}
                    >
                      Upload & Render
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Stack gap={2}>
              <Card>
                <CardHeader title="Viewer" />
                <CardContent>
                  <div className="viewer-container">
                    {sceneData ? (
                      <>
                        <CrystalToolkitScene
                          className="ctk-viewer"
                          data={sceneData}
                          toggleVisibility={visibility}
                          sceneSize="100%"
                          settings={{ renderer: 'webgl', zoomToFit2D: true, extractAxis: true, secondaryObjectView: true }}
                          axisView="SW"
                          showPositionButton
                          showExportButton
                          fileOptions={[
                            'CIF (Symmetrized)',
                            'CIF',
                            'POSCAR',
                            'JSON',
                            'Prismatic',
                            'VASP Input Set (MPRelaxSet)'
                          ]}
                          setProps={(p:any) => setSceneProps((s:any) => ({ ...s, ...p }))}
                        >
                          <LayerToggles visibility={visibility} onChange={setVisibility} />
                        </CrystalToolkitScene>
                        {/* Triggers a browser download when data is set */}
                        <Download id="image-download" data={downloadData} />
                      </>
                    ) : (
                      <Typography color="text.secondary">
                        No scene loaded yet or scene format unsupported.
                        Use Prompt or Upload to generate a scene compatible with CrystalToolkitScene.
                      </Typography>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader title="Metadata" />
                <CardContent>
                  {result ? (
                    <List>
                      <ListItem>
                        <ListItemText primary="Formula" secondary={result.formula} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Number of sites" secondary={result.n_sites} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Source" secondary={result.source} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="a" secondary={result.lattice.a} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="b" secondary={result.lattice.b} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="c" secondary={result.lattice.c} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="alpha" secondary={result.lattice.alpha} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="beta" secondary={result.lattice.beta} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="gamma" secondary={result.lattice.gamma} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="volume" secondary={result.lattice.volume} />
                      </ListItem>
                    </List>
                  ) : (
                    <Typography color="text.secondary">No metadata yet.</Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

type LayerTogglesProps = {
  visibility: Record<string, 0 | 1>
  onChange: (v: Record<string, 0 | 1>) => void
}

function LayerToggles({ visibility, onChange }: LayerTogglesProps) {
  const set = (k: string, v: boolean) => onChange({ ...visibility, [k]: v ? 1 : 0 })
  return (
    <Stack gap={1} sx={{ minWidth: 220 }}>
      <Typography variant="subtitle2">Hide/show</Typography>
      <Divider />
      <FormGroup>
        <FormControlLabel control={<Checkbox size="small" checked={!!visibility.atoms} onChange={(e) => set('atoms', e.target.checked)} />} label="Atoms" />
        <FormControlLabel control={<Checkbox size="small" checked={!!visibility.bonds} onChange={(e) => set('bonds', e.target.checked)} />} label="Bonds" />
        <FormControlLabel control={<Checkbox size="small" checked={!!visibility.unit_cell} onChange={(e) => set('unit_cell', e.target.checked)} />} label="Unit cell" />
        <FormControlLabel control={<Checkbox size="small" checked={!!visibility.polyhedra} onChange={(e) => set('polyhedra', e.target.checked)} />} label="Polyhedra" />
        <FormControlLabel control={<Checkbox size="small" checked={!!visibility.axes} onChange={(e) => set('axes', e.target.checked)} />} label="Axes" />
      </FormGroup>
    </Stack>
  )
}
