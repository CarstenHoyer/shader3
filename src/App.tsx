import React, {createRef, useMemo, useRef, useState} from 'react';
import { extend } from '@react-three/fiber'
import glsl from 'babel-plugin-glsl/macro'
import * as THREE from 'three';
import { after } from 'underscore'
import './App.css';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import Video from './Video';
import { MeshDistortMaterial, shaderMaterial, Text } from '@react-three/drei';
import { a } from '@react-spring/three'
import { useSpring } from '@react-spring/three';
import { atom, useAtom } from 'jotai'

const showVideoNumber = atom(null)

const AnimatedMaterial = a(MeshDistortMaterial)

const data = [
  {
    title: 'LUCIFER RISING',
    director: 'Kenneth Anger',
    titlePos: [11.4,2],
    subtitlePos: [13.2,1.2],
  },
  {
    title: 'MEDITATION ON VIOLENCE',
    director: 'Maya Deren',
    titlePos: [9,2],
    subtitlePos: [13.4,1.3],
  },
  {
    title: 'DOG STAR MAN',
    director: 'Stan Brakhage',
    titlePos: [11.6,2],
    subtitlePos: [13.4,1.3],
  },
  {
    title: 'MESHES OF THE AFTERNOON',
    director: 'Maya Deren',
    titlePos: [8.4,2],
    subtitlePos: [13.4,1.3],
  }

]

const FadeVideoMaterial = shaderMaterial(
  { time: 0, map: null },
  glsl`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 distortion = position * 2.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  glsl`
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    uniform sampler2D map;
    void main() {
      // gl_FragColor.rgba = vec4(0.5 + 0.3 * sin(vUv.yxx + time) + color, 1.0);
      gl_FragColor = texture2D(map, vUv);
    }
  `
)

const TextRenderMaterial = shaderMaterial(
  { time: 0, color: new THREE.Color(0.2, 0.0, 0.1) },
  // vertex shader
  glsl`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  glsl`
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      gl_FragColor.rgba = vec4(0.5 + 0.3 * sin(vUv.yxx + time) + color, 1.0);
    }
  `
)

extend({ TextRenderMaterial })
extend({ FadeVideoMaterial })

const VideoBlob = (props: any) => {
  const ref = useRef<THREE.Mesh>()
  const [showVideo, setShowVideo] = useAtom(showVideoNumber)
  const [hovered, setHovered] = useState(false)
  const [mode, setMode] = useState(false)
  const [down, setDown] = useState(false)
  // Springs for color and overall looks, this is state-driven animation
  // React-spring is physics based and turns static props into animated values
  const [{ wobble, coat, env }] = useSpring(
    {
      wobble: down ? 1.2 * props.scale : hovered ? 1.05 * props.scale : 1 * props.scale,
      coat: mode && !hovered ? 4 : 2,
      env: mode && !hovered ? 4 : 10,
      config: (n) => {
        if (n === 'wobble' && hovered) {
          return { mass: 2, tension: 1000, friction: 10 }
        }
        return{}
      }
    },
    [mode, hovered, down]
  )

  const xDir = useMemo(() => Math.round(Math.random()) ? 1 : -1, [])
  const yDir = useMemo(() => Math.round(Math.random()) ? 1 : -1, [])

  useFrame(({clock}) => {
    if (!ref.current) return
    ref.current.position.x = props.position[0] + (xDir * (Math.sin(clock.elapsedTime * 0.5) * 0.15))
    ref.current.position.y = props.position[1] + (yDir * (Math.sin(clock.elapsedTime * 0.5) * 0.2))
  })

  return (
    <a.mesh {...props}
      ref={ref}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => {
        setDown(false)
        setMode(!mode)
        if (props.index === showVideo) {
          setShowVideo(null)
        } else {
          setShowVideo(props.index)
        }
      }}
      scale={wobble}
    >
      <icosahedronBufferGeometry args={[props.radius, 12]} />
      {/* @ts-ignore */ }
      <AnimatedMaterial transparent={true} color={props.color} envMapIntensity={env} clearcoat={coat} clearcoatRoughness={0} metalness={0.1}>
        <videoTexture format={THREE.RGBAFormat} args={[props.video]} attach="map" repeat={new THREE.Vector2(1,1)} offset={props.offset} />
      </AnimatedMaterial>
    </a.mesh>
  )
}

const Scene = (props: any) => {
  const { viewport } = useThree()
  const { videos } = props
  const radius = 1
  return (
    <>
     <VideoBlob
      index={0}
      video={videos[0].current}
      scale={1}
      radius={radius}
      position={[(-viewport.width * 0.5 + radius * 2), (viewport.height * 0.5 - radius * 2), 0]}
      color="hotpink"
      offset={new THREE.Vector2(0,0)}
    /> 
     <VideoBlob 
      index={1}
      video={videos[1].current}
      scale={.7}
      radius={radius}
      position={[(-viewport.width * 0.5 + radius * 2) + viewport.width * 0.25, (viewport.height * 0.5 - radius * 2) + .4, 0]}
      offset={new THREE.Vector2(-0.3, -0.1)}
      color="gold"
    /> 
     <VideoBlob 
      index={2}
      video={videos[2].current}
      scale={.75}
      radius={radius}
      position={[(viewport.width * 0.5 - radius * 2) - viewport.width * 0.25, (viewport.height * 0.5 - radius * 2) + .7, 0]}
      color="white"
      offset={new THREE.Vector2(0,0)}
    /> 
     <VideoBlob 
      index={3}
      video={videos[3].current}
      scale={.95}
      radius={radius}
      position={[(viewport.width * 0.5 - radius * 2), (viewport.height * 0.5 - radius * 2) + 0.5, 0]}
      color="lightgreen"
      offset={new THREE.Vector2(-0.3,0)}
    /> 
    </>
  )
}

const ShowVideo = (props: any) => {
  const { viewport } = useThree()
  if (props.showIndex === null) return null
  const { showIndex: index } = props

  const [titlePosX, titlePoxY]  = data[index].titlePos
  const [subtitlePosX, subtitlePosY]  = data[index].subtitlePos

  return (
    <group>
      <a.mesh {...props}>
        <planeBufferGeometry args={[viewport.width, viewport.height, 100, 100]} />
        {/* @ts-ignore */ }
        <fadeVideoMaterial>
          <videoTexture args={[props.videos[props.showIndex].current]} attach="map" repeat={new THREE.Vector2(1,1)} offset={props.offset} />
        </fadeVideoMaterial>
      </a.mesh>
      <Text position={new THREE.Vector3(-viewport.width * 0.5 + titlePosX, -viewport.height * 0.5 + titlePoxY, 0)} fontSize={1} letterSpacing={-0.05} lineHeight={1} characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!">
        <textRenderMaterial />
        {data[index].title}
      </Text>
      <Text position={new THREE.Vector3(-viewport.width * 0.5 + subtitlePosX, -viewport.height * 0.5 + subtitlePosY, 0)}  fontSize={0.5} letterSpacing={-0.05} lineHeight={1} characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!">
        {data[index].director}
      </Text>
    </group>
  )
}

const App = () => {
  const [showVideo] = useAtom(showVideoNumber)
  const [videosLoaded, setVideosLoaded] = useState(false)
  const videos = ['./kenneth_small.mp4', './deren_small.mp4', './stan_small.mp4', './deren2_small.mp4']
  const videoRefs = useRef(videos.map(v => createRef<HTMLVideoElement>()))

  const onVideosLoaded = after(videos.length, () => {
    setVideosLoaded(true)
  })

  const onVideoLoad = () => {
    onVideosLoaded()
  }

  return (
    <div className="App">
      <div className="videos">
        {videos.map((video, index) => (
          <Video key={index} ref={videoRefs.current[index]} src={video} autoPlay muted loop onLoad={onVideoLoad} />  
        ))}
      </div>
      {videosLoaded ? (<Canvas orthographic dpr={[1,2]} camera={{ zoom: 100, position: [0, 0, 100] }}>
        <Scene videos={videoRefs.current} />
        <ShowVideo videos={videoRefs.current} showIndex={showVideo} />
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <Text fontSize={0} characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!">
          
        </Text>
      </Canvas>) : null}
    </div>
  );
}

export default App;
