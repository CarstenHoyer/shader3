import React, {createRef, useEffect, useMemo, useRef, useState} from 'react';
import { extend } from '@react-three/fiber'
import glsl from 'babel-plugin-glsl/macro'
import * as THREE from 'three';
import { after } from 'underscore'
import './App.css';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import Video from './Video';
import { ContactShadows, MeshDistortMaterial, PerspectiveCamera, shaderMaterial, Text } from '@react-three/drei';
import { a } from '@react-spring/three'
import { useSpring } from '@react-spring/three';
import { atom, useAtom } from 'jotai'
import { CompressedTextureLoader, MeshPhysicalMaterial } from 'three';
import { isNonNullExpression } from 'typescript';

const showVideoNumber = atom(null)

const AnimatedMaterial = a(MeshDistortMaterial)

const data = [
  {
    title: 'LUCIFER RISING',
    director: 'Kenneth Anger',
    titlePos: [0,0],
    subtitlePos: [5,-.25],
  },
  {
    title: 'MEDITATION ON VIOLENCE',
    director: 'Maya Deren',
    titlePos: [-4.7,0],
    subtitlePos: [5.3,-.25],
  },
  {
    title: 'DOG STAR MAN',
    director: 'Stan Brakhage',
    titlePos: [-.1,0],
    subtitlePos: [5,-.25],
  },
  {
    title: 'MESHES OF THE AFTERNOON',
    director: 'Maya Deren',
    titlePos: [-5.8,0],
    subtitlePos: [5.3,-.25],
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

const BigVideoBlob = (props: any) => {
  const textureRef = useRef<THREE.VideoTexture>(null)
  const ref = useRef<THREE.Mesh>()
  const [showVideo, setShowVideo] = useAtom(showVideoNumber)
  const [hovered, setHovered] = useState(false)
  const [mode, setMode] = useState(false)
  const [down, setDown] = useState(false)
  // Springs for color and overall looks, this is state-driven animation
  // React-spring is physics based and turns static props into animated values
  const [{ wobble, coat, env }] = useSpring(
    {
      wobble: down ? 1.05 * props.scale : hovered ? 1.02 * props.scale : 1 * props.scale,
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
    <group>
      {/* <ContactShadows
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, -1.6, -1]}
        opacity={mode ? 0.8 : 0.4}
        width={15}
        height={15}
        blur={2.5}
        far={1.6}
      /> */}
    <a.mesh {...props}
      ref={ref}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={() => setDown(true)}
      onPointerUp={() => {
        setDown(false)
      }}
      scale={wobble}
    >
      <icosahedronBufferGeometry args={[props.radius, 64]} />
      {/* @ts-ignore */ }
      <AnimatedMaterial distort={props.distort || .3} transparent={true} color={props.color} envMapIntensity={env} clearcoat={coat} clearcoatRoughness={0} metalness={0.1}>
      </AnimatedMaterial>
      {props.video && (<AnimatedMaterial distort={props.distort || .2} transparent={true} color={props.video ? 'white' : props.color} envMapIntensity={env} clearcoat={coat} clearcoatRoughness={0} metalness={0.1}>
        <videoTexture ref={textureRef} format={THREE.RGBAFormat} args={[props.video]} attach="map" repeat={new THREE.Vector2(1,1)} offset={props.offset} />
      </AnimatedMaterial>)}
    </a.mesh>


    </group>
  )
}

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
    <group>
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
      <AnimatedMaterial distort={props.distort || .5} transparent={true} color={props.color} envMapIntensity={env} clearcoat={coat} clearcoatRoughness={0} metalness={0.1}>
        <videoTexture format={THREE.RGBAFormat} args={[props.video]} attach="map" repeat={new THREE.Vector2(1,1)} offset={props.offset} />
      </AnimatedMaterial>
    </a.mesh>

    </group>
  )
}

const Scene = (props: any) => {
  const [showVideo] = useAtom(showVideoNumber)
  const { viewport } = useThree()
  const { videos } = props
  const radius = Math.min(1.5, viewport.width * 0.08)
  const centerRadius = Math.min(viewport.height * 0.80, viewport.width * 0.80)
  const video = showVideo !== null ? videos[showVideo].current : null
  return (
    <>
    <BigVideoBlob 
      distort={.12}
      index={3}
      video={video}
      scale={1}
      radius={centerRadius}
      position={[0,0,-8]}
      color="lightpink"
      offset={new THREE.Vector2(-0.3,0)}
    />
     <VideoBlob
      index={0}
      video={videos[0].current}
      scale={1}
      radius={radius}
      position={[-viewport.width * 0.5 + radius * 2.5,viewport.height * 0.5 - radius * 2.5,0]}
      color="hotpink"
      offset={new THREE.Vector2(0,0)}
    /> 
     <VideoBlob 
      index={1}
      video={videos[1].current}
      scale={.7}
      radius={radius}
      position={[-viewport.width * .25 + radius * 2.5,viewport.height * 0.5 - radius * 1.5,0]}
      offset={new THREE.Vector2(-0.3, -0.1)}
      color="gold"
    /> 
     <VideoBlob 
      index={2}
      video={videos[2].current}
      scale={.75}
      radius={radius}
      position={[-viewport.width * 0 + radius * 2.5,viewport.height * 0.5 - radius * 2,0]}
      color="white"
      offset={new THREE.Vector2(0,0)}
    /> 
     <VideoBlob 
      index={3}
      video={videos[3].current}
      scale={.95}
      radius={radius}
      position={[-viewport.width * -.25 + radius * 2.5,viewport.height * 0.5 - radius * 4,0]}
      color="lightgreen"
      offset={new THREE.Vector2(-0.3,0)}
    /> 
    </>
  )
}

const ShowVideo = (props: any) => {
  const { viewport } = useThree()
  // 30.7 = 2.5
  // 15.62 = 1.27
  // 10 = 0.81
  const titleRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (!titleRef.current) return
    titleRef.current.scale.set(1,1,1)
  })

  const { showIndex: index } = props

  console.log({data, index})

  return (
    <group>
      {props.showIndex !== null && (<group position={new THREE.Vector3(0, -1, -1)}>
        <Text ref={titleRef} position={new THREE.Vector3(0,0,0)}  fontSize={viewport.width * 0.071} letterSpacing={-0.05} lineHeight={1} characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!">
          <textRenderMaterial />
          {data[index].title}
        </Text>
        <Text color="lightgrey" position={new THREE.Vector3(0,-.75,0)} fontSize={viewport.width * 0.03} letterSpacing={-0.05} lineHeight={1} characters="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!">
          {data[index].director}
        </Text>
      </group>)}
    </group>
  )
}

const App = () => {
  const [showVideo] = useAtom(showVideoNumber)
  const [videosLoaded, setVideosLoaded] = useState(false)
  const purl = process.env.PUBLIC_URL
  const videos = [
    `${purl}/kenneth_small.mp4`, 
    `${purl}/deren_small.mp4`,
    `${purl}/stan_small.mp4`, 
    `${purl}/deren2_small.mp4`
  ]
  const videoRefs = useRef(videos.map(v => createRef<HTMLVideoElement>()))

  const onVideosLoaded = after(videos.length, () => {
    setVideosLoaded(true)
  })

  const onVideoLoad = () => {
    onVideosLoaded()
  }

  const MyCamera = () => {
    const camera = useRef<THREE.PerspectiveCamera>(null)

    useFrame(({ clock }) => {
      if (!camera.current) return
      const a = clock.getElapsedTime()
      camera.current.position.set(Math.sin(a * 0.25) * 2,0,10)
      camera.current.lookAt(new THREE.Vector3(0,0,0))
    })

    return (
      <PerspectiveCamera ref={camera} makeDefault position={[0, 0, 4]} fov={50} />
    )
  }

  return (
    <div className="App">
      <div className="videos">
        {videos.map((video, index) => (
          <Video key={index} ref={videoRefs.current[index]} src={video} autoPlay muted loop onLoad={onVideoLoad} />  
        ))}
      </div>
      {videosLoaded ? (<Canvas dpr={[1,2]}>
        <MyCamera />
        
        <mesh position={new THREE.Vector3(0,0,-10)}>
          <planeBufferGeometry args={[100, 100]} />
          <meshBasicMaterial color="lightpink" />
        </mesh>
        <Scene videos={videoRefs.current} />
        <ShowVideo videos={videoRefs.current} showIndex={showVideo} />
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
      </Canvas>) : null}
    </div>
  );
}

export default App;
