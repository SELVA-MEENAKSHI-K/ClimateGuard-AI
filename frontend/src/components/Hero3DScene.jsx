import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';

// 1. Heat Hazard Scene: Glowing Sun, Rotating Corona Rings, Heat Shimmer Particles
const HeatScene = () => {
  const sunRef = useRef();
  const ringRef = useRef();
  const particlesRef = useRef();

  const particleCount = 60;
  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = Math.random() * 2.5 - 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      spd[i] = 0.01 + Math.random() * 0.015;
    }
    return [pos, spd];
  }, []);

  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.5;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.8;
      ringRef.current.rotation.x += delta * 0.3;
    }
    if (particlesRef.current) {
      const posArr = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] += speeds[i];
        if (posArr[i * 3 + 1] > 2.5) {
          posArr[i * 3 + 1] = -0.5;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Warm Ground Disk */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[2.2, 2.0, 0.25, 24]} />
        <meshStandardMaterial color="#c2410c" roughness={0.8} />
      </mesh>

      {/* Sun Mesh */}
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh ref={sunRef} position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.75, 24, 24]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#fbbf24"
            emissiveIntensity={0.7}
            roughness={0.2}
          />
        </mesh>

        {/* Corona Ring */}
        <mesh ref={ringRef} position={[0, 0.8, 0]}>
          <torusGeometry args={[1.15, 0.03, 12, 36]} />
          <meshBasicMaterial color="#fef08a" />
        </mesh>
      </Float>

      {/* Heat Shimmer Rising Particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.06} color="#fde047" transparent opacity={0.6} />
      </points>
    </group>
  );
};

// 2. Heavy Rain Hazard Scene: Fluffy Clouds, Falling Rain Streaks, Wet Ground
const RainScene = () => {
  const rainRef = useRef();
  const cloudRef = useRef();
  const rainCount = 120;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(rainCount * 3);
    const spd = new Float32Array(rainCount);
    for (let i = 0; i < rainCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.2;
      pos[i * 3 + 1] = Math.random() * 2.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
      spd[i] = 0.04 + Math.random() * 0.04;
    }
    return [pos, spd];
  }, []);

  useFrame((state, delta) => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.2;
    }
    if (rainRef.current) {
      const posArr = rainRef.current.geometry.attributes.position.array;
      for (let i = 0; i < rainCount; i++) {
        posArr[i * 3 + 1] -= speeds[i];
        if (posArr[i * 3 + 1] < -0.4) {
          posArr[i * 3 + 1] = 2.4;
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Wet Island Ground Disk */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[2.2, 2.0, 0.25, 24]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>

      {/* Water Puddle Surface */}
      <mesh position={[0, -0.46, 0]}>
        <cylinderGeometry args={[1.5, 1.5, 0.02, 24]} />
        <meshStandardMaterial color="#38bdf8" roughness={0.1} metalness={0.7} />
      </mesh>

      {/* Cloud Formation */}
      <group ref={cloudRef} position={[0, 1.5, 0]}>
        <mesh position={[-0.4, 0, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        <mesh position={[0.3, 0.1, 0]}>
          <sphereGeometry args={[0.65, 16, 16]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.9} />
        </mesh>
        <mesh position={[0.7, -0.1, 0]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>
        <mesh position={[-0.1, 0.2, 0.2]}>
          <sphereGeometry args={[0.55, 16, 16]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.9} />
        </mesh>
      </group>

      {/* Falling Rain Particles */}
      <points ref={rainRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={rainCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.045} color="#38bdf8" transparent opacity={0.8} />
      </points>
    </group>
  );
};

// 3. Drought Hazard Scene: Dry Cracked Ground, Wilting Stem, Dusty Haze
const DroughtScene = () => {
  const stemRef = useRef();
  const dustRef = useRef();
  const dustCount = 45;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(dustCount * 3);
    const spd = new Float32Array(dustCount);
    for (let i = 0; i < dustCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = Math.random() * 1.5 - 0.3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
      spd[i] = 0.005 + Math.random() * 0.008;
    }
    return [pos, spd];
  }, []);

  useFrame((state, delta) => {
    if (stemRef.current) {
      stemRef.current.rotation.z = -0.35 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    }
    if (dustRef.current) {
      const posArr = dustRef.current.geometry.attributes.position.array;
      for (let i = 0; i < dustCount; i++) {
        posArr[i * 3] += speeds[i];
        if (posArr[i * 3] > 1.8) {
          posArr[i * 3] = -1.8;
        }
      }
      dustRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Cracked Earth Ground Disk */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[2.2, 2.0, 0.25, 20]} />
        <meshStandardMaterial color="#92400e" roughness={0.95} />
      </mesh>

      {/* Surface Fissures / Dry Patches */}
      <mesh position={[0.4, -0.46, 0.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshBasicMaterial color="#78350f" />
      </mesh>

      {/* Wilted Stem */}
      <group ref={stemRef} position={[0, -0.45, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.04, 0.06, 0.9, 8]} />
          <meshStandardMaterial color="#a16207" roughness={0.8} />
        </mesh>
        {/* Drooping Leaf */}
        <mesh position={[0.2, 0.75, 0]} rotation={[0, 0, -1]}>
          <coneGeometry args={[0.12, 0.45, 6]} />
          <meshStandardMaterial color="#854d0e" roughness={0.8} />
        </mesh>
      </group>

      {/* Swirling Arid Dust Particles */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={dustCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#d97706" transparent opacity={0.45} />
      </points>
    </group>
  );
};

// 4. Strong Wind Hazard Scene: Swaying Tree, Swirling Wind Streaks
const WindScene = () => {
  const treeRef = useRef();
  const canopyRef = useRef();
  const windStreamRef = useRef();
  const windCount = 50;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(windCount * 3);
    const spd = new Float32Array(windCount);
    for (let i = 0; i < windCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.5;
      pos[i * 3 + 1] = Math.random() * 2 - 0.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
      spd[i] = 0.05 + Math.random() * 0.05;
    }
    return [pos, spd];
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime * 4.5;
    const sway = Math.sin(t) * 0.2 + 0.15; // wind pushing towards right
    if (treeRef.current) {
      treeRef.current.rotation.z = sway * 0.6;
    }
    if (canopyRef.current) {
      canopyRef.current.rotation.z = sway;
    }
    if (windStreamRef.current) {
      const posArr = windStreamRef.current.geometry.attributes.position.array;
      for (let i = 0; i < windCount; i++) {
        posArr[i * 3] += speeds[i];
        if (posArr[i * 3] > 2.2) {
          posArr[i * 3] = -2.2;
        }
      }
      windStreamRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Ground Disk */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[2.2, 2.0, 0.25, 24]} />
        <meshStandardMaterial color="#1e3a1f" roughness={0.8} />
      </mesh>

      {/* Swaying Tree */}
      <group position={[-0.3, -0.45, 0]}>
        {/* Trunk */}
        <mesh ref={treeRef} position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.06, 0.1, 1.0, 8]} />
          <meshStandardMaterial color="#573719" roughness={0.8} />
        </mesh>
        {/* Canopy Clusters */}
        <group ref={canopyRef} position={[0.2, 1.1, 0]}>
          <mesh position={[0, 0, 0]}>
            <dodecahedronGeometry args={[0.55]} />
            <meshStandardMaterial color="#15803d" roughness={0.6} />
          </mesh>
          <mesh position={[0.3, -0.1, 0.1]}>
            <dodecahedronGeometry args={[0.4]} />
            <meshStandardMaterial color="#16a34a" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Wind Stream Particles */}
      <points ref={windStreamRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={windCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.04} color="#a7f3d0" transparent opacity={0.7} />
      </points>
    </group>
  );
};

// 5. Favorable / Low Risk Scene: Green Landscape, Sprout, Gentle Sun
const FavorableScene = () => {
  const sproutRef = useRef();
  const sunRef = useRef();

  useFrame((state, delta) => {
    if (sproutRef.current) {
      sproutRef.current.rotation.y += delta * 0.4;
    }
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group>
      {/* Lush Green Ground Disk */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[2.2, 2.0, 0.25, 24]} />
        <meshStandardMaterial color="#15803d" roughness={0.7} />
      </mesh>

      {/* Sprouting Young Crop */}
      <group ref={sproutRef} position={[0, -0.45, 0]}>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.7, 8]} />
          <meshStandardMaterial color="#4ade80" roughness={0.6} />
        </mesh>
        <mesh position={[0.15, 0.65, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.14, 0.35, 6]} />
          <meshStandardMaterial color="#22c55e" roughness={0.5} />
        </mesh>
        <mesh position={[-0.15, 0.55, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.12, 0.3, 6]} />
          <meshStandardMaterial color="#22c55e" roughness={0.5} />
        </mesh>
      </group>

      {/* Friendly Warm Sun */}
      <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh ref={sunRef} position={[1.1, 1.2, -0.5]}>
          <sphereGeometry args={[0.45, 20, 20]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#f59e0b"
            emissiveIntensity={0.5}
            roughness={0.3}
          />
        </mesh>
      </Float>
    </group>
  );
};

// Main 3D Hero Scene with gentle auto-rotation and pointer response
const SceneContent = ({ topHazard = 'favorable' }) => {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    // Slow auto rotation
    groupRef.current.rotation.y += 0.003;

    // Subtle pointer parallax response
    const targetRotX = -state.pointer.y * 0.15;
    const targetRotZ = state.pointer.x * 0.15;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.05);
  });

  return (
    <group ref={groupRef}>
      {topHazard === 'heat' && <HeatScene />}
      {topHazard === 'rain' && <RainScene />}
      {topHazard === 'drought' && <DroughtScene />}
      {topHazard === 'wind' && <WindScene />}
      {topHazard === 'favorable' && <FavorableScene />}
    </group>
  );
};

export default function Hero3DScene({ topHazard = 'favorable' }) {
  return (
    <div className="w-full h-56 sm:h-64 relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 1.8, 4.2], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 8, 5]} intensity={1.1} castShadow />
        <directionalLight position={[-4, 3, -3]} intensity={0.3} color="#93c5fd" />
        <SceneContent topHazard={topHazard} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}
