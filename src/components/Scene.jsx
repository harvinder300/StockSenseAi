import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

const Scene = ({ section, setSection }) => {
    const meshRef = useRef()

    useFrame(() => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.01
            meshRef.current.rotation.y += 0.01
        }
    })

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />

            <mesh ref={meshRef}>
                <boxGeometry args={[2, 2, 2]} />
                <meshStandardMaterial color="red" />
            </mesh>

            <gridHelper args={[10, 10]} />
        </>
    )
}

export default Scene
