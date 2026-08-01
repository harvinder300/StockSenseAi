import React, { useMemo } from 'react'
import { Text, Float, Line, Cloud, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import ResumeNode from './ResumeNode'
import resumeData from '../data/resumeData.json'

const HackerRoom = ({ section }) => {
    // Define positions for each section node
    const nodes = useMemo(() => [
        { id: 0, label: 'PROFILE', position: [0, 0, 0], data: resumeData.contact },
        { id: 1, label: 'EXPERIENCE', position: [-4, 0, -2], data: resumeData.experience },
        { id: 2, label: 'SKILLS', position: [4, 0, -2], data: resumeData.skills },
        { id: 3, label: 'PROJECTS', position: [0, 2, -4], data: resumeData.projects }
    ], [])

    return (
        <group>
            {nodes.map((node) => (
                <ResumeNode
                    key={node.id}
                    {...node}
                    isActive={section === node.id}
                />
            ))}

            {/* Visual connections between nodes */}
            <Line
                points={[nodes[0].position, nodes[1].position]}
                color={section === 1 ? '#00ff41' : '#004411'}
                lineWidth={2}
                dashed={false}
            />
            <Line
                points={[nodes[0].position, nodes[2].position]}
                color={section === 2 ? '#00ff41' : '#004411'}
                lineWidth={2}
                dashed={false}
            />
            <Line
                points={[nodes[0].position, nodes[3].position]}
                color={section === 3 ? '#00ff41' : '#004411'}
                lineWidth={2}
                dashed={false}
            />

            {/* Environment Effects */}
            <Sparkles count={200} scale={12} size={2} speed={0.4} opacity={0.5} color="#00ff41" />
            <Cloud opacity={0.1} speed={0.2} width={20} depth={5} segments={10} color="#002200" position={[0, -5, -10]} />

            {/* Random Floating Geometric Shapes for ambiance */}
            <Float speed={1} rotationIntensity={1} floatIntensity={1}>
                <group position={[-6, 3, -6]}>
                    <mesh>
                        <boxGeometry args={[0.5, 0.5, 0.5]} />
                        <meshBasicMaterial color="#004411" wireframe />
                    </mesh>
                </group>
                <group position={[6, -2, -6]}>
                    <mesh>
                        <dodecahedronGeometry args={[0.5]} />
                        <meshBasicMaterial color="#004411" wireframe />
                    </mesh>
                </group>
            </Float>

        </group>
    )
}

export default HackerRoom
