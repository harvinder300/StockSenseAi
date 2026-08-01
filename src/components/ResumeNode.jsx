import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float, Html } from '@react-three/drei'
import * as THREE from 'three'

const ResumeNode = ({ position, label, isActive, data }) => {
    const meshRef = useRef()
    const [hovered, setHover] = useState(false)

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005
            meshRef.current.rotation.x += 0.002

            // Pulse effect if active or hovered
            const targetScale = isActive || hovered ? 1.2 : 1
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1)
        }
    })

    return (
        <group position={position}>
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh
                    ref={meshRef}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                >
                    <icosahedronGeometry args={[1, 0]} />
                    <meshPhysicalMaterial
                        color={isActive ? "#00ff41" : "#004411"}
                        emissive={isActive ? "#00ff41" : "#000000"}
                        emissiveIntensity={isActive ? 0.5 : 0}
                        roughness={0.2}
                        metalness={0.8}
                        transmission={0.5} // Simple glass effect
                        thickness={1}
                        wireframe={false}
                    />
                </mesh>

                {/* Wireframe overlay for tech look */}
                <mesh scale={[1.01, 1.01, 1.01]}>
                    <icosahedronGeometry args={[1, 1]} />
                    <meshBasicMaterial color={isActive ? "#00ff41" : "#003300"} wireframe transparent opacity={0.3} />
                </mesh>

                {/* HTML Label - Safer than 3D Text */}
                <Html position={[0, 1.5, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
                    <div style={{
                        color: '#00ff41',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        textShadow: '0 0 5px black',
                        whiteSpace: 'nowrap',
                        background: 'rgba(0,0,0,0.5)',
                        padding: '2px 5px'
                    }}>
                        {label}
                    </div>
                </Html>
            </Float>
        </group>
    )
}

export default ResumeNode
