import {
  CameraControls,
  Environment,
  Gltf,
  Grid,
  PerspectiveCamera,
  PositionalAudio,
  useGLTF,
} from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  ConvexHullCollider,
  CuboidCollider,
  quat,
  RigidBody,
  vec3,
} from "@react-three/rapier";
import { useCallback, useEffect, useRef, useState } from "react";
import { degToRad, randFloat } from "three/src/math/MathUtils.js";
import { Color } from "three";
import { VFXEmitter, VFXParticles } from "wawa-vfx";
import * as THREE from "three";
import { AUDIOS } from "../App";
import { balloonMaterials, useGame } from "../hooks/useGame";
import { GradientSky } from "./GradientSky";

export const Experience = () => {
  const { nodes } = useGLTF("models/Axe Small Applied.glb");

  const controls = useRef();
  const axeLaunched = useGame((state) => state.axeLaunched);
  const firstGame = useGame((state) => state.firstGame);
  const throws = useGame((state) => state.throws);
  const specialEffectActive = useGame((state) => state.specialEffectActive);
  const bladefallActive = useGame((state) => state.bladefallActive);
  const cameraShake = useGame((state) => state.cameraShake);
  const slowMotionActive = useGame((state) => state.slowMotionActive);
  const timeScale = useGame((state) => state.timeScale);
  const giantTargetActive = useGame((state) => state.giantTargetActive);
  
  // Camera shake effect
  const shakeOffset = useRef({ x: 0, y: 0, z: 0 });
  
  // Slow motion effect: Scale gravity for all physics objects
  // This creates a natural slow-motion effect without freezing
  useEffect(() => {
    // Apply gravity scale to all rigid bodies when slow motion activates/deactivates
    // We'll handle this per-component since we need refs to each RigidBody
  }, [slowMotionActive, timeScale]);
  
  useFrame(() => {
    if (cameraShake && controls.current) {
      // Apply random shake offset
      const intensity = 0.1;
      shakeOffset.current = {
        x: (Math.random() - 0.5) * intensity,
        y: (Math.random() - 0.5) * intensity,
        z: (Math.random() - 0.5) * intensity * 0.5,
      };
    } else {
      // Smoothly return to normal
      shakeOffset.current = {
        x: shakeOffset.current.x * 0.9,
        y: shakeOffset.current.y * 0.9,
        z: shakeOffset.current.z * 0.9,
      };
    }
  });

  useEffect(() => {
    if (!controls.current) return;
    
    let baseLookAt = { x: 0, y: 0, z: 0 };
    let basePosition = { x: -0.1, y: 0, z: 0 };
    
    if (firstGame) {
      basePosition = { x: -15, y: -5, z: 20 };
      baseLookAt = { x: 10, y: 0, z: 0 };
    } else if (axeLaunched || throws === 0 || bladefallActive) {
      // Same camera view for axe launch and Bladefall effect
      if (window.innerWidth < 1024) {
        basePosition = { x: -10, y: 10, z: 40 };
      } else {
        basePosition = { x: 10, y: 0, z: 30 };
      }
      baseLookAt = { x: 10, y: 0, z: 0 };
    } else {
      basePosition = { x: -0.1, y: 0, z: 0 };
      baseLookAt = { x: 0, y: 0, z: 0 };
    }

    // Apply shake offset
    const pos = {
      x: basePosition.x + shakeOffset.current.x,
      y: basePosition.y + shakeOffset.current.y,
      z: basePosition.z + shakeOffset.current.z,
    };

    controls.current.setLookAt(pos.x, pos.y, pos.z, baseLookAt.x, baseLookAt.y, baseLookAt.z, true);
  }, [axeLaunched, throws, firstGame, cameraShake, bladefallActive]);

  return (
    <>
      <CameraControls
        ref={controls}
        mouseButtons={{
          left: 0,
          middle: 0,
          right: 0,
        }}
        touches={{
          one: 0,
          two: 0,
          three: 0,
        }}
      />
      <VFXEmitter
        emitter="stars"
        settings={{
          duration: 10,
          delay: 0,
          nbParticles: 5000,
          spawnMode: "time",
          loop: true,
          startPositionMin: [-20, -20, -20],
          startPositionMax: [20, 20, 20],
          startRotationMin: [0, 0, 0],
          startRotationMax: [0, 0, 0],
          particlesLifetime: [4, 10],
          speed: [0, 0.2],
          directionMin: [-1, -1, -1],
          directionMax: [1, 1, 1],
          rotationSpeedMin: [0, 0, 0],
          rotationSpeedMax: [0, 0, 0],
          colorStart: ["#ffffff", "#b7b0e3", "pink"],
          size: [0.01, 0.05],
        }}
      />
      <Walls />
      <Balloons />
      <AxeController />
      {specialEffectActive && <SpecialEffect />}
      {bladefallActive && <BladefallEffect nodes={nodes} />}

      <GradientSky />
      {/* Regular target - positioned at x: 20 in world space */}
      <group position-y={-1}>
        {!giantTargetActive && <Target />}
      </group>
      {/* Giant Target - positioned at x: 20 in world space (replaces regular target) */}
      <group position-y={-1}>
        {giantTargetActive && <GiantTarget />}
      </group>
      <Grid
        position-y={-10}
        infiniteGrid
        sectionColor={"#999"}
        cellColor={"#555"}
        fadeStrength={5}
      />
      <directionalLight
        position={[30, 15, 30]}
        castShadow
        intensity={1}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-bias={-0.005}
      >
        <PerspectiveCamera
          attach={"shadow-camera"}
          near={10}
          far={50}
          fov={80}
        />
      </directionalLight>
      <Gltf
        src="models/AncientRuins-v1.glb"
        castShadow
        receiveShadow
        scale={3}
        rotation-y={degToRad(-90)}
        position-y={-8}
        position-x={10}
      />
      <Environment preset="sunset" environmentIntensity={0.3} />

      <VFXParticles
        name="stars"
        geometry={<circleGeometry args={[0.1, 20]} />}
        settings={{
          fadeAlpha: [0.5, 0.5],
          fadeSize: [0.5, 0.5],
          gravity: [0, 0.2, 0],
          intensity: 5,
          nbParticles: 5000,
          renderMode: "billboard",
        }}
      />
      <VFXParticles
        name="sparks"
        settings={{
          fadeAlpha: [0, 1],
          fadeSize: [0, 0],
          gravity: [0, -10, 0],
          intensity: 8,
          nbParticles: 100000,
          renderMode: "billboard",
        }}
      />
      <VFXParticles
        name="axes"
        geometry={<primitive object={nodes.Axe_small.geometry} />}
        settings={{
          fadeAlpha: [0, 0],
          fadeSize: [0, 1],
          intensity: 2,
          nbParticles: 200,
          renderMode: "mesh",
        }}
      />
    </>
  );
};

const Target = () => {
  const rb = useRef();
  const timeScale = useGame((state) => state.timeScale);
  const slowMotionActive = useGame((state) => state.slowMotionActive);
  const accumulatedTime = useRef(0);

  useFrame((state, delta) => {
    if (rb.current) {
      // Scale delta time for slow motion animation
      // When timeScale is 0.5, time progresses at half speed
      const scaledDelta = slowMotionActive ? delta * timeScale : delta;
      accumulatedTime.current += scaledDelta;
      
      rb.current.setTranslation(
        vec3({ x: 20, y: Math.sin(accumulatedTime.current * 2) * 2, z: 0 }),
        true
      );
    }
  });
  return (
    <RigidBody ref={rb} name="target" colliders="hull" type="kinematicPosition">
      <Gltf
        src="models/Ancient Ruins target.glb"
        rotation-y={degToRad(-90)}
        scale={3}
        position-x={0}
        position-y={1}
      />
    </RigidBody>
  );
};

// Giant Target Component - Large glowing target with multiplier
// Replaces regular target at the same position
const GiantTarget = () => {
  const rb = useRef();
  const targetGroup = useRef();
  const haloRef = useRef();
  const glowRef = useRef();
  const giantTargetActive = useGame((state) => state.giantTargetActive);
  const giantTargetMultiplier = useGame((state) => state.giantTargetMultiplier);
  const incrementGiantTargetHits = useGame((state) => state.incrementGiantTargetHits);
  const onTargetHit = useGame((state) => state.onTargetHit);
  const addArenaPoints = useGame((state) => state.addArenaPoints);
  const slowMotionActive = useGame((state) => state.slowMotionActive);
  const timeScale = useGame((state) => state.timeScale);
  const [hitPosition, setHitPosition] = useState(null);
  const [hitPoints, setHitPoints] = useState(0);
  const rotationSpeed = useRef(0.5);
  const pulsePhase = useRef(0);
  const accumulatedTime = useRef(0); // Same as regular target for consistent floating
  
  // Initialize position when Giant Target becomes active
  useEffect(() => {
    if (giantTargetActive && rb.current) {
      // Set initial position to match regular target (x: 20, floating at y: 0)
      rb.current.setTranslation(
        vec3({ x: 20, y: 0, z: 0 }),
        true
      );
    }
  }, [giantTargetActive]);
  
  // Handle collision with axes
  const handleCollision = useCallback((e) => {
    if (!giantTargetActive) return;
    
    const hitByName = e?.other?.rigidBodyObject?.name;
    if (hitByName === "axe" || hitByName?.startsWith("clone_axe_") || hitByName?.startsWith("bladefall_axe_")) {
      const position = rb.current?.translation();
      if (position) {
        setHitPosition({ x: position.x, y: position.y, z: position.z });
        // Calculate points: base target hit (50) * multiplier
        const points = 50 * giantTargetMultiplier;
        setHitPoints(points);
        // Add points to arena points
        addArenaPoints(points);
        // Increment hit counter
        incrementGiantTargetHits();
        // Call onTargetHit - points are already multiplied, so just call once
        // The multiplier is applied to the points, not the hit count
        onTargetHit();
        // Reset hit display after animation
        setTimeout(() => {
          setHitPosition(null);
          setHitPoints(0);
        }, 2000);
      }
    }
  }, [giantTargetActive, giantTargetMultiplier, incrementGiantTargetHits, onTargetHit, addArenaPoints]);
  
  // Rotate and animate the giant target - uses same positioning as regular target
  useFrame((state, delta) => {
    if (rb.current && giantTargetActive) {
      // Scale delta time for slow motion animation (same as regular target)
      const scaledDelta = slowMotionActive ? delta * timeScale : delta;
      accumulatedTime.current += scaledDelta;
      
      // Use the exact same positioning as regular target
      // Regular target sets: x: 20, y: Math.sin(accumulatedTime.current * 2) * 2, z: 0
      // This is in world space, so we use the same values
      const floatY = Math.sin(accumulatedTime.current * 2) * 2; // Same as regular target
      rb.current.setTranslation(
        vec3({ x: 20, y: floatY, z: 0 }), // Exact same position as regular target (x: 20 for distance)
        true
      );
      
      // Rotate the target group
      if (targetGroup.current) {
        targetGroup.current.rotation.y += rotationSpeed.current * scaledDelta;
      }
      
      // Pulsing glow effect
      pulsePhase.current += scaledDelta * 2;
      if (glowRef.current) {
        const glowIntensity = 1 + Math.sin(pulsePhase.current) * 0.3;
        glowRef.current.intensity = glowIntensity * 2;
      }
      
      // Halo rotation
      if (haloRef.current) {
        haloRef.current.rotation.y -= scaledDelta * 0.3;
        haloRef.current.rotation.z += scaledDelta * 0.2;
      }
    }
  });
  
  if (!giantTargetActive) return null;
  
  return (
    <>
      <RigidBody 
        ref={rb} 
        name="giantTarget" 
        colliders="hull" 
        type="kinematicPosition"
        onIntersectionEnter={handleCollision}
      >
        <group ref={targetGroup} position={[0, 0, 0]}>
          {/* Main Target - Large scale */}
          <Gltf
            src="models/Ancient Ruins target.glb"
            rotation-y={degToRad(-90)}
            scale={6} // Much larger than regular target (3x scale)
            position-x={0}
            position-y={1} // Same y offset as regular target
          />
          
          {/* Glowing Halo Ring */}
          <mesh ref={haloRef} position={[0, 1, 0]} rotation-x={degToRad(90)}>
            <torusGeometry args={[3.5, 0.1, 16, 32]} />
            <meshStandardMaterial
              color="#FFD700"
              emissive="#FFD700"
              emissiveIntensity={2}
              transparent
              opacity={0.8}
            />
          </mesh>
          
          {/* Outer Glow Ring */}
          <mesh position={[0, 1, 0]} rotation-x={degToRad(90)}>
            <torusGeometry args={[4, 0.15, 16, 32]} />
            <meshStandardMaterial
              color="#FF6B00"
              emissive="#FF6B00"
              emissiveIntensity={1.5}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          {/* Pulsing Glow Effect */}
          <pointLight
            ref={glowRef}
            position={[0, 1, 0]}
            color="#FFD700"
            intensity={2}
            distance={10}
            decay={2}
          />
        </group>
      </RigidBody>
      
      {/* Hit Particles and Score Pop-up */}
      {hitPosition && (
        <group position={[hitPosition.x, hitPosition.y, hitPosition.z]}>
          {/* Massive particle burst */}
          <VFXEmitter
            emitter="stars"
            settings={{
              loop: false,
              spawnMode: "burst",
              nbParticles: 1000,
              duration: 2,
              size: [0.05, 0.8],
              startPositionMin: [-0.5, -0.5, -0.5],
              startPositionMax: [0.5, 0.5, 0.5],
              directionMin: [-3, -2, -3],
              directionMax: [3, 4, 3],
              rotationSpeedMin: [-10, -10, -30],
              rotationSpeedMax: [10, 10, 30],
              speed: [2, 12],
              particlesLifetime: [0.5, 2],
              colorStart: ["#FFD700", "#FF6B00", "#FFA500", "#FFE135", "#FFC125"],
            }}
          />
        </group>
      )}
    </>
  );
};

const Walls = () => {
  return (
    <>
      <RigidBody type="fixed" position-z={-1}>
        <CuboidCollider args={[100, 100, 0.1]} />
      </RigidBody>
      <RigidBody type="fixed" position-z={1}>
        <CuboidCollider args={[100, 100, 0.1]} />
      </RigidBody>
      {/* Ground collider for Bladefall axes */}
      <RigidBody type="fixed" position-y={-10} name="ground">
        <CuboidCollider args={[100, 0.1, 100]} />
      </RigidBody>
    </>
  );
};

const Balloons = () => {
  const balloons = useGame((state) => state.balloons);

  return balloons.map((balloon) => (
    <Balloon 
      key={balloon.id} 
      {...balloon} 
      isStormBalloon={balloon.isStormBalloon || false}
      points={balloon.points || 5}
      lifetime={balloon.lifetime}
    />
  ));
};

const Balloon = ({ id, position, color, isStormBalloon = false, points = 5, lifetime }) => {
  const { nodes, materials } = useGLTF("models/balloon_modified.glb");
  const rb = useRef();
  const [exploded, setExploded] = useState(false);
  const [spawnTime] = useState(Date.now());
  const slowMotionActive = useGame((state) => state.slowMotionActive);
  const timeScale = useGame((state) => state.timeScale);
  const balloonStormActive = useGame((state) => state.balloonStormActive);
  const incrementBalloonStreak = useGame((state) => state.incrementBalloonStreak);
  const addArenaPoints = useGame((state) => state.addArenaPoints);
  
  // Calculate dynamic damping based on slow motion
  const linearDamping = slowMotionActive ? 0.2 + (1.0 - timeScale) * 0.3 : 0.2;
  const angularDamping = slowMotionActive ? 0.2 + (1.0 - timeScale) * 0.3 : 0.2;

  useEffect(() => {
    if (rb.current) {
      rb.current.applyTorqueImpulse(
        {
          x: Math.random() * 0.05,
          y: Math.random() * 0.05,
          z: Math.random() * 0.05,
        },
        true
      );
    }
  }, []);

  // Apply gravity scale for slow motion
  useEffect(() => {
    if (rb.current && !exploded) {
      if (slowMotionActive) {
        // Balloons have negative gravity, so scale it
        rb.current.setGravityScale(-0.1 * timeScale);
      } else {
        rb.current.setGravityScale(-0.1);
      }
    }
  }, [slowMotionActive, timeScale, exploded]);
  
  // Apply slow motion to balloon velocities in useFrame (smooth interpolation)
  useFrame(() => {
    if (rb.current && !exploded && slowMotionActive) {
      const currentVel = rb.current.linvel();
      if (currentVel) {
        const targetVel = {
          x: currentVel.x * timeScale,
          y: currentVel.y * timeScale,
          z: currentVel.z * timeScale,
        };
        // Smooth interpolation to avoid freezing
        rb.current.setLinvel({
          x: currentVel.x + (targetVel.x - currentVel.x) * 0.15,
          y: currentVel.y + (targetVel.y - currentVel.y) * 0.15,
          z: currentVel.z + (targetVel.z - currentVel.z) * 0.15,
        }, true);
      }
      const currentAngVel = rb.current.angvel();
      if (currentAngVel) {
        const targetAngVel = {
          x: currentAngVel.x * timeScale,
          y: currentAngVel.y * timeScale,
          z: currentAngVel.z * timeScale,
        };
        rb.current.setAngvel({
          x: currentAngVel.x + (targetAngVel.x - currentAngVel.x) * 0.15,
          y: currentAngVel.y + (targetAngVel.y - currentAngVel.y) * 0.15,
          z: currentAngVel.z + (targetAngVel.z - currentAngVel.z) * 0.15,
        }, true);
      }
    }
  });

  // Initialize storm balloon with horizontal drift velocity
  useEffect(() => {
    if (rb.current && isStormBalloon && !exploded) {
      // Give storm balloons initial horizontal drift velocity (from right to left)
      const currentVel = rb.current.linvel();
      if (!currentVel || (Math.abs(currentVel.x) < 0.1 && Math.abs(currentVel.y) < 0.1)) {
        rb.current.setLinvel({
          x: randFloat(-3, -1.5), // Drift from right to left
          y: randFloat(-0.5, 0.5),
          z: randFloat(-0.5, 0.5),
        }, true);
      }
    }
  }, [isStormBalloon, exploded]);
  
  useFrame(() => {
    if (rb.current && !exploded) {
      const curTranslation = rb.current.translation();
      
      // Different behavior for storm balloons - drift horizontally
      if (isStormBalloon) {
        // Storm balloons drift from right to left across the play area
        // Remove if too far left or out of bounds
        if (curTranslation.x < -15 || curTranslation.y > 25 || curTranslation.y < -25) {
          setExploded(true);
        }
      } else {
        // Regular balloon behavior - wrap around vertically
        if (curTranslation.y > 20) {
          curTranslation.y = randFloat(-20, -15);
          rb.current.setLinvel({
            x: 0,
            y: 0,
            z: 0,
          }, true);
          rb.current.setAngvel({
            x: 0,
            y: 0,
            z: 0,
          }, true);
          rb.current.applyTorqueImpulse(
            {
              x: Math.random() * 0.05,
              y: Math.random() * 0.05,
              z: Math.random() * 0.05,
            },
            true
          );
        }
      }
      rb.current.setTranslation(curTranslation, true);
    }
  });
  
  const onBalloonHit = useGame((state) => state.onBalloonHit);
  useEffect(() => {
    if (exploded) {
      onBalloonHit();
      // Increment streak if it's a storm balloon
      if (isStormBalloon) {
        incrementBalloonStreak();
        // Add points for storm balloon
        addArenaPoints(points);
      }
    }
  }, [exploded, isStormBalloon, points, incrementBalloonStreak, addArenaPoints]);
  
  // Handle storm balloon lifetime - remove after lifetime expires
  useEffect(() => {
    if (isStormBalloon && lifetime) {
      const timer = setTimeout(() => {
        if (rb.current && !exploded) {
          setExploded(true);
        }
      }, lifetime * 1000);
      return () => clearTimeout(timer);
    }
  }, [isStormBalloon, lifetime, exploded]);

  const onIntersectionEnter = useCallback((e) => {
    // Check if hit by player axe, falling Bladefall axe, or clone axe
    const hitByName = e.other.rigidBodyObject.name;
    if (
      hitByName === "axe" ||
      hitByName?.startsWith("bladefall_axe_") ||
      hitByName?.startsWith("clone_axe_")
    ) {
      setExploded(true);
      // console.log("Balloon hit by:", hitByName);
    }
  }, []);

  // Storm balloons are slightly larger and have different scale
  const balloonScale = isStormBalloon ? randFloat(1.2, 1.8) : 1.0;
  
  return (
    <RigidBody
      type="dynamic"
      position={position}
      ref={rb}
      name={`balloon_${id}`}
      gravityScale={isStormBalloon ? (slowMotionActive ? -0.05 * timeScale : -0.05) : (slowMotionActive ? -0.1 * timeScale : -0.1)}
      mass={isStormBalloon ? 0.15 : 0.1}
      linearDamping={isStormBalloon ? 0.1 : 0.2}
      angularDamping={isStormBalloon ? 0.1 : 0.2}
      restitution={1}
      onIntersectionEnter={onIntersectionEnter}
    >
      {exploded && (
        <>
          <PositionalAudio
            url={AUDIOS.pop}
            autoplay
            loop={false}
            distance={10}
          />
          {/* Enhanced confetti effect for storm balloons */}
          {isStormBalloon ? (
            <>
              <VFXEmitter
                emitter="stars"
                settings={{
                  loop: false,
                  spawnMode: "burst",
                  nbParticles: 500,
                  duration: 2,
                  size: [0.02, 0.5],
                  startPositionMin: [-0.2, -0.2, -0.2],
                  startPositionMax: [0.2, 0.2, 0.2],
                  directionMin: [-2, -1, -2],
                  directionMax: [2, 3, 2],
                  rotationSpeedMin: [-5, -5, -20],
                  rotationSpeedMax: [5, 5, 20],
                  speed: [0.5, 8],
                  particlesLifetime: [0.5, 2],
                  colorStart: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FF6B9D", "#C44569", "#FFA07A", "#98D8C8"],
                }}
              />
              {/* Additional confetti burst */}
              <VFXEmitter
                emitter="stars"
                settings={{
                  loop: false,
                  spawnMode: "burst",
                  nbParticles: 300,
                  duration: 1.5,
                  size: [0.03, 0.4],
                  startPositionMin: [-0.3, -0.3, -0.3],
                  startPositionMax: [0.3, 0.3, 0.3],
                  directionMin: [-3, -2, -3],
                  directionMax: [3, 4, 3],
                  rotationSpeedMin: [-10, -10, -30],
                  rotationSpeedMax: [10, 10, 30],
                  speed: [1, 10],
                  particlesLifetime: [0.3, 1.5],
                  colorStart: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#FF6B9D", "#C44569", "#FFA07A", "#98D8C8"],
                }}
              />
            </>
          ) : (
            <VFXEmitter
              emitter="sparks"
              settings={{
                loop: false,
                spawnMode: "burst",
                nbParticles: 100,
                duration: 1,
                size: [0.05, 0.3],
                startPositionMin: [-0.1, -0.1, -0.1],
                startPositionMax: [0.1, 0.1, 0.1],
                directionMin: [-0.1, 0, -0.1],
                directionMax: [0.1, 0.5, 0.1],
                rotationSpeedMin: [-1, -1, -10],
                rotationSpeedMax: [1, 1, 10],
                speed: [0.1, 2],
                particlesLifetime: [0.1, 1],
                colorStart: ["orange", "orangered"],
              }}
            />
          )}
        </>
      )}
      <group dispose={null} visible={!exploded} scale={3 * balloonScale}>
        <ConvexHullCollider
          args={[nodes.Balloon.geometry.attributes.position.array]}
        />
        <mesh
          geometry={nodes.Balloon.geometry}
          material={balloonMaterials[color]}
        />
        <mesh geometry={nodes.Logo.geometry} material={materials.Logo} />
        <mesh
          geometry={nodes.String.geometry}
          material={balloonMaterials[color]}
        />
      </group>
    </RigidBody>
  );
};

const AxeController = ({ ...props }) => {
  const rb = useRef();

  const axeLaunched = useGame((state) => state.axeLaunched);
  const launchAxe = useGame((state) => state.launchAxe);
  const monitorOpen = useGame((state) => state.monitorOpen);
  const cloneThrowActive = useGame((state) => state.cloneThrowActive);
  const consumeCloneThrow = useGame((state) => state.consumeCloneThrow);
  const slowMotionActive = useGame((state) => state.slowMotionActive);
  const timeScale = useGame((state) => state.timeScale);
  const [cloneAxes, setCloneAxes] = useState([]);

  useEffect(() => {
    const onPointerUp = (e) => {
      // Don't launch if monitor is open or if clicking on UI elements
      if (monitorOpen) {
        return;
      }
      // Check if the click target is a button or UI element
      const target = e.target;
      if (
        target.closest("button") ||
        target.closest(".pointer-events-auto") ||
        target.closest("[data-ui-element]")
      ) {
        return;
      }
      launchAxe();
    };
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [monitorOpen, launchAxe]);
  const [impact, setImpact] = useState(false);
  const onTargetHit = useGame((state) => state.onTargetHit);

  useEffect(() => {
    if (impact) {
      onTargetHit();
    }
  }, [impact]);

  // Apply gravity scale when slow motion state changes
  // Don't use damping - it causes freezing. Instead, we'll scale velocities in useFrame
  useEffect(() => {
    if (rb.current) {
      if (slowMotionActive) {
        rb.current.setGravityScale(timeScale);
      } else {
        rb.current.setGravityScale(1.0);
      }
    }
  }, [slowMotionActive, timeScale]);

  useEffect(() => {
    if (axeLaunched) {
      rb.current.setBodyType(0); // 0 = dynamic
      rb.current.setLinvel({ x: 0, y: 0, z: 0 });
      rb.current.setAngvel({ x: 0, y: 0, z: 0 });
      // Apply impulse - don't scale by timeScale (let gravity and damping handle slow motion)
      // This ensures axes still travel the same distance, just slower
      rb.current.applyImpulse({ 
        x: 1, 
        y: 0.5, 
        z: 0 
      }, true);
      rb.current.applyTorqueImpulse({ 
        x: 0, 
        y: 0, 
        z: -0.2
      }, true);
      
      // Adjust audio playback rate for slow motion pitch effect
      if (sfxThrow.current) {
        try {
          // Access the underlying audio buffer source
          const audio = sfxThrow.current;
          if (audio.buffer && audio.source) {
            // Set playback rate on the audio source
            audio.source.playbackRate.value = slowMotionActive ? timeScale : 1.0;
          }
        } catch (error) {
          // Fallback: audio might not be ready yet
          console.log("Audio playback rate adjustment skipped:", error);
        }
      }
      sfxThrow.current.play();

      // Spawn clone axe sequentially (after a delay) if Clone Throw is active
      if (cloneThrowActive) {
        consumeCloneThrow();
        
        // Wait 0.25 seconds to spawn the clone axe (sequentially, not simultaneously)
        const cloneSpawnDelay = setTimeout(() => {
          if (!rb.current) return;
          
          try {
            // Get current position and velocity of main axe (it's already in flight)
            const mainAxePos = rb.current.translation();
            const mainAxeLinvel = rb.current.linvel();
            const mainAxeAngvel = rb.current.angvel();
            
            // Extract velocity components (handle both object and vector formats)
            const velX = mainAxeLinvel?.x ?? 1;
            const velY = mainAxeLinvel?.y ?? 0.5;
            const velZ = mainAxeLinvel?.z ?? 0;
            
            // Extract position components
            const posX = mainAxePos?.x ?? 1;
            const posY = mainAxePos?.y ?? -0.2;
            const posZ = mainAxePos?.z ?? 0;
            
            // Extract angular velocity components
            const angVelX = mainAxeAngvel?.x ?? 0;
            const angVelY = mainAxeAngvel?.y ?? 0;
            const angVelZ = mainAxeAngvel?.z ?? -0.2;
            
            // Clone axe starts slightly behind the main axe (trailing effect)
            // Calculate a position that's slightly behind based on velocity direction
            const velocityMagnitude = Math.sqrt(velX * velX + velY * velY + velZ * velZ);
            
            // Spawn clone 0.4 units behind the main axe
            const trailingDistance = 0.4;
            const normalizedVel = velocityMagnitude > 0.01 
              ? {
                  x: velX / velocityMagnitude,
                  y: velY / velocityMagnitude,
                  z: velZ / velocityMagnitude,
                }
              : { x: 1, y: 0.5, z: 0 }; // Fallback to initial direction
            
            const cloneAxeId = `clone_axe_${Date.now()}_${Math.random()}`;
            const newCloneAxe = {
              id: cloneAxeId,
              position: {
                // Position slightly behind the main axe
                x: posX - normalizedVel.x * trailingDistance,
                y: posY - normalizedVel.y * trailingDistance,
                z: posZ - normalizedVel.z * trailingDistance,
              },
              velocity: {
                // Use same velocity as main axe (so it follows the same path)
                x: velX,
                y: velY,
                z: velZ,
              },
              rotation: {
                // Use same angular velocity as main axe
                x: angVelX,
                y: angVelY,
                z: angVelZ,
              },
            };
            
            setCloneAxes((prev) => [...prev, newCloneAxe]);
            
            // Clean up this specific clone axe after 3 seconds
            setTimeout(() => {
              setCloneAxes((prev) => prev.filter((axe) => axe.id !== cloneAxeId));
            }, 3000);
          } catch (error) {
            console.error("Error spawning clone axe:", error);
            // Fallback: spawn clone at initial position with default velocity
            const cloneAxeId = `clone_axe_${Date.now()}_${Math.random()}`;
            const newCloneAxe = {
              id: cloneAxeId,
              position: { x: 1, y: -0.2, z: 0 },
              velocity: { x: 1, y: 0.5, z: 0 },
              rotation: { x: 0, y: 0, z: -0.2 },
            };
            setCloneAxes((prev) => [...prev, newCloneAxe]);
            setTimeout(() => {
              setCloneAxes((prev) => prev.filter((axe) => axe.id !== cloneAxeId));
            }, 3000);
          }
        }, 250); // 250ms delay for sequential throw
        
        // Cleanup timeout on unmount
        return () => clearTimeout(cloneSpawnDelay);
      }
    } else {
      setImpact(false);
    }
  }, [axeLaunched, cloneThrowActive, consumeCloneThrow]);

  const sfxThrow = useRef();
  const sfxHit = useRef();

  useFrame(({ pointer, viewport }, delta) => {
    if (!axeLaunched && rb.current) {
      rb.current.setRotation(quat(0, 0, 0, 1), true);
      rb.current.setTranslation({
        x: 1,
        y: -0.2 + pointer.y * 0.5,
        z: pointer.x * 0.5,
      });

      rb.current.setLinvel({ x: 0, y: 0, z: 0 });
      rb.current.setAngvel({ x: 0, y: 0, z: 0 });
    } else if (axeLaunched && rb.current && slowMotionActive) {
      // For slow motion: Maintain velocity but scale it continuously
      // This creates smooth slow motion without freezing
      const currentVel = rb.current.linvel();
      if (currentVel && (Math.abs(currentVel.x) > 0.01 || Math.abs(currentVel.y) > 0.01 || Math.abs(currentVel.z) > 0.01)) {
        // Scale velocity to timeScale, but use lerp to avoid sudden changes
        const targetVel = {
          x: currentVel.x * timeScale,
          y: currentVel.y * timeScale,
          z: currentVel.z * timeScale,
        };
        // Smoothly interpolate towards scaled velocity
        rb.current.setLinvel({
          x: currentVel.x + (targetVel.x - currentVel.x) * 0.1,
          y: currentVel.y + (targetVel.y - currentVel.y) * 0.1,
          z: currentVel.z + (targetVel.z - currentVel.z) * 0.1,
        }, true);
      }
      const currentAngVel = rb.current.angvel();
      if (currentAngVel) {
        const targetAngVel = {
          x: currentAngVel.x * timeScale,
          y: currentAngVel.y * timeScale,
          z: currentAngVel.z * timeScale,
        };
        rb.current.setAngvel({
          x: currentAngVel.x + (targetAngVel.x - currentAngVel.x) * 0.1,
          y: currentAngVel.y + (targetAngVel.y - currentAngVel.y) * 0.1,
          z: currentAngVel.z + (targetAngVel.z - currentAngVel.z) * 0.1,
        }, true);
      }
    }
  });

  return (
    <group {...props}>
      <PositionalAudio
        url={AUDIOS.impact}
        autoplay={false}
        ref={sfxHit}
        loop={false}
        distance={10}
      />
      {impact && (
        <group position={[impact.x, impact.y, impact.z]}>
          <VFXEmitter
            emitter="sparks"
            settings={{
              spawnMode: "burst",
              nbParticles: 8000,
              duration: 1,
              size: [0.01, 0.62],
              startPositionMin: [0, 0, 0],
              startPositionMax: [0, 0, 0],
              directionMin: [-1, -1, -1],
              directionMax: [1, 1, 1],
              rotationSpeedMin: [-1, -1, -10],
              rotationSpeedMax: [1, 1, 10],
              speed: [0.1, 10],
              particlesLifetime: [0.1, 1],
              colorStart: ["orange", "orangered"],
            }}
          />
        </group>
      )}
      <RigidBody
        ref={rb}
        position-x={0}
        name="axe"
        type={"kinematicPosition"}
        colliders="hull"
        sensor
        onIntersectionEnter={(e) => {
          const otherName = e.other.rigidBodyObject.name;
          if (otherName === "target" || otherName === "giantTarget") {
            rb.current.setBodyType(2); // 2 = "kinematicPosition"
            rb.current.setLinvel({ x: 0, y: 0, z: 0 });
            rb.current.setAngvel({ x: 0, y: 0, z: 0 });
            setImpact(rb.current.translation());
            sfxHit.current.stop();
            sfxHit.current.play();
            
            // Handle giant target hit (multiplier applied in GiantTarget component)
            if (otherName === "giantTarget") {
              // Points are handled by GiantTarget component's collision handler
            }
          }
        }}
      >
        <PositionalAudio
          ref={sfxThrow}
          autoplay={false}
          url={AUDIOS.throw}
          loop={false}
          distance={50}
        />
        <Gltf src="models/Axe Small.glb" position-y={-0.3} />

        {axeLaunched && !impact && (
          <group>
            <VFXEmitter
              position-y={-0.3}
              emitter="axes"
              settings={{
                loop: true,
                spawnMode: "time",
                nbParticles: 80,
                particlesLifetime: [1, 1],
                duration: 0.5,
                size: [1, 1],
                startPositionMin: [0, 0, 0],
                startPositionMax: [0, 0, 0],
                directionMin: [0, 0, 0],
                directionMax: [0, 0, 0],
                startRotationMin: [0, 0, 0],
                startRotationMax: [0, 0, 0],
                speed: [0.1, 2],
                colorStart: ["#424242"],
              }}
            />
          </group>
        )}
      </RigidBody>

      {/* Clone Throw Axes */}
      {cloneAxes.map((cloneAxe) => (
        <CloneAxe
          key={cloneAxe.id}
          id={cloneAxe.id}
          initialPosition={cloneAxe.position}
          initialVelocity={cloneAxe.velocity}
          initialRotation={cloneAxe.rotation}
        />
      ))}
    </group>
  );
};

// Clone Axe Component - Semi-transparent duplicate axe
const CloneAxe = ({ id, initialPosition, initialVelocity, initialRotation }) => {
  const rb = useRef();
  const [hasImpacted, setHasImpacted] = useState(false);
  const sfxHit = useRef();
  const { scene } = useGLTF("models/Axe Small.glb");
  const [clonedScene, setClonedScene] = useState(null);
  const slowMotionActive = useGame((state) => state.slowMotionActive);
  const timeScale = useGame((state) => state.timeScale);
  
  // Apply gravity scale for slow motion
  useEffect(() => {
    if (rb.current) {
      if (slowMotionActive) {
        rb.current.setGravityScale(timeScale);
      } else {
        rb.current.setGravityScale(1.0);
      }
    }
  }, [slowMotionActive, timeScale]);
  
  // Apply slow motion to clone axe velocities in useFrame (smooth interpolation)
  useFrame(() => {
    if (rb.current && !hasImpacted && slowMotionActive) {
      const currentVel = rb.current.linvel();
      if (currentVel) {
        const targetVel = {
          x: currentVel.x * timeScale,
          y: currentVel.y * timeScale,
          z: currentVel.z * timeScale,
        };
        // Smooth interpolation to maintain motion without freezing
        rb.current.setLinvel({
          x: currentVel.x + (targetVel.x - currentVel.x) * 0.15,
          y: currentVel.y + (targetVel.y - currentVel.y) * 0.15,
          z: currentVel.z + (targetVel.z - currentVel.z) * 0.15,
        }, true);
      }
      const currentAngVel = rb.current.angvel();
      if (currentAngVel) {
        const targetAngVel = {
          x: currentAngVel.x * timeScale,
          y: currentAngVel.y * timeScale,
          z: currentAngVel.z * timeScale,
        };
        rb.current.setAngvel({
          x: currentAngVel.x + (targetAngVel.x - currentAngVel.x) * 0.15,
          y: currentAngVel.y + (targetAngVel.y - currentAngVel.y) * 0.15,
          z: currentAngVel.z + (targetAngVel.z - currentAngVel.z) * 0.15,
        }, true);
      }
    }
  });
  
  // Clone scene and modify materials for darker, shadowy appearance
  useEffect(() => {
    if (!scene) return;
    const cloned = scene.clone();
    cloned.traverse((child) => {
      if (child.isMesh && child.material) {
        const material = child.material.clone();
        material.transparent = true;
        material.opacity = 0.4; // More transparent (darker/shadowy)
        // Darken the color to make it look like a shadow/clone
        if (material.color) {
          material.color = material.color.clone().multiplyScalar(0.5); // Darken significantly
        }
        // Set emissive to a darker, more shadowy color (dark blue/purple)
        if (material.emissive) {
          if (typeof material.emissive.setRGB === 'function') {
            material.emissive.setRGB(0.1, 0.15, 0.3); // Darker, more shadowy
          } else {
            material.emissive = new Color(0.1, 0.15, 0.3);
          }
        } else {
          material.emissive = new Color(0.1, 0.15, 0.3);
        }
        if (material.emissiveIntensity !== undefined) {
          material.emissiveIntensity = 0.2; // Lower emissive intensity
        }
        child.material = material;
      }
    });
    setClonedScene(cloned);
  }, [scene]);

  useEffect(() => {
    if (!rb.current) return;

    // Set initial position
    rb.current.setTranslation(
      vec3({
        x: initialPosition.x,
        y: initialPosition.y,
        z: initialPosition.z,
      }),
      true
    );

    // Make it dynamic
    rb.current.setBodyType(0); // dynamic
    // Use normal velocities (gravity scale will handle slow motion)
    rb.current.setLinvel(
      {
        x: initialVelocity.x,
        y: initialVelocity.y,
        z: initialVelocity.z,
      },
      true
    );
    rb.current.setAngvel(
      {
        x: initialRotation.x,
        y: initialRotation.y,
        z: initialRotation.z - 0.2, // Slight rotation like main axe
      },
      true
    );
  }, [initialPosition, initialVelocity, initialRotation]);

  const handleImpact = useCallback(
    (e) => {
      if (hasImpacted || !rb.current) return;

      const otherName = e?.other?.rigidBodyObject?.name;

      // Check if collision is with target
      if (otherName === "target") {
        const onTargetHit = useGame.getState().onTargetHit;
        // Double points for clone axe hit (call twice)
        onTargetHit();
        onTargetHit();
        setHasImpacted(true);
        if (rb.current) {
          rb.current.setBodyType(2); // kinematic
          rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
        if (sfxHit.current) {
          try {
            // Adjust playback rate for slow motion
            if (slowMotionActive && sfxHit.current.source) {
              sfxHit.current.source.playbackRate.value = timeScale;
            }
          } catch (error) {
            // Ignore if audio not ready
          }
          sfxHit.current.stop();
          sfxHit.current.play();
        }
      }
      // Check if collision is with balloon
      else if (otherName?.startsWith("balloon_")) {
        const onBalloonHit = useGame.getState().onBalloonHit;
        // Double points for clone axe hit (call twice)
        onBalloonHit();
        onBalloonHit();
        setHasImpacted(true);
        if (rb.current) {
          rb.current.setBodyType(2); // kinematic
          rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
        if (sfxHit.current) {
          try {
            // Adjust playback rate for slow motion
            if (slowMotionActive && sfxHit.current.source) {
              sfxHit.current.source.playbackRate.value = timeScale;
            }
          } catch (error) {
            // Ignore if audio not ready
          }
          sfxHit.current.stop();
          sfxHit.current.play();
        }
      }
    },
    [hasImpacted, slowMotionActive, timeScale]
  );

  // Fallback: check position if collision doesn't work
  useFrame(() => {
    if (!rb.current || hasImpacted) return;

    const position = rb.current.translation();
    // Check if hit ground (y < -8.5) or went too far
    if (position.y < -8.5 || position.x > 30 || Math.abs(position.z) > 10) {
      setHasImpacted(true);
      if (rb.current) {
        rb.current.setBodyType(2); // kinematic
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      }
    }
  });

  return (
    <group>
      <PositionalAudio
        url={AUDIOS.impact}
        autoplay={false}
        ref={sfxHit}
        loop={false}
        distance={15}
      />
      <RigidBody
        ref={rb}
        name={`clone_axe_${id}`}
        type="dynamic"
        colliders="hull"
        sensor
        onIntersectionEnter={handleImpact}
      >
        {/* Dark shadowy clone axe with subtle trail effect */}
        {clonedScene ? (
          <group scale={1} rotation-y={degToRad(90)} position-y={-0.3}>
            <primitive object={clonedScene} />
            {/* Subtle darker trail effect for shadowy appearance */}
            <VFXEmitter
              emitter="stars"
              settings={{
                loop: true,
                spawnMode: "time",
                nbParticles: 20,
                particlesLifetime: [0.2, 0.6],
                duration: 2,
                size: [0.015, 0.04],
                startPositionMin: [0, 0, 0],
                startPositionMax: [0, 0, 0],
                directionMin: [-0.15, -0.15, -0.15],
                directionMax: [0.15, 0.15, 0.15],
                rotationSpeedMin: [0, 0, 0],
                rotationSpeedMax: [1.5, 1.5, 1.5],
                speed: [0.1, 0.5],
                colorStart: ["#2a2a4a", "#1a1a3a", "#3a3a5a", "#1a1a2a"], // Darker, shadowy colors
                fadeAlpha: [0.8, 0],
              }}
            />
          </group>
        ) : (
          <Gltf src="models/Axe Small.glb" position-y={-0.3} />
        )}
      </RigidBody>
    </group>
  );
};

// Special Effect Component for boosts > 50
const SpecialEffect = () => {
  return (
    <>
      {/* Screen-wide particle effect */}
      <VFXEmitter
        emitter="stars"
        settings={{
          duration: 3,
          delay: 0,
          nbParticles: 2000,
          spawnMode: "time",
          loop: true,
          startPositionMin: [-30, -30, -30],
          startPositionMax: [30, 30, 30],
          startRotationMin: [0, 0, 0],
          startRotationMax: [0, 360, 0],
          particlesLifetime: [2, 4],
          speed: [0.5, 2],
          directionMin: [-1, -1, -1],
          directionMax: [1, 1, 1],
          rotationSpeedMin: [0, 0, 0],
          rotationSpeedMax: [5, 5, 5],
          colorStart: ["#FFD700", "#FFA500", "#FF6347", "#FF1493"],
          size: [0.1, 0.3],
        }}
      />
      {/* Multiple burst effects */}
      {[...Array(5)].map((_, i) => (
        <VFXEmitter
          key={i}
          emitter="sparks"
          settings={{
            spawnMode: "burst",
            nbParticles: 500,
            duration: 0.5,
            delay: i * 0.5,
            size: [0.1, 0.5],
            startPositionMin: [
              Math.random() * 20 - 10,
              Math.random() * 20 - 10,
              Math.random() * 20 - 10,
            ],
            startPositionMax: [
              Math.random() * 20 - 10,
              Math.random() * 20 - 10,
              Math.random() * 20 - 10,
            ],
            directionMin: [-2, -2, -2],
            directionMax: [2, 2, 2],
            rotationSpeedMin: [-5, -5, -10],
            rotationSpeedMax: [5, 5, 10],
            speed: [2, 10],
            colorStart: ["#FFD700", "#FFA500", "#FF6347"],
            particlesLifetime: [1, 2],
          }}
        />
      ))}
    </>
  );
};

// Bladefall Effect Component - Rain of Mini-Axes
const BladefallEffect = ({ nodes }) => {
  const [axes, setAxes] = useState([]);
  const [impactPositions, setImpactPositions] = useState([]);

  useEffect(() => {
    // Spawn 5-20 axes
    const numAxes = Math.floor(Math.random() * 16) + 5; // 5-20 axes
    const newAxes = [];
    
    for (let i = 0; i < numAxes; i++) {
      newAxes.push({
        id: `bladefall_axe_${i}_${Date.now()}`,
        // Random X position above arena (spread across -15 to 25)
        startX: randFloat(-15, 25),
        startZ: randFloat(-5, 5),
        startY: randFloat(15, 25), // Start above
        delay: Math.random() * 2, // Stagger the spawn
      });
    }
    
    setAxes(newAxes);
  }, []);

  const handleImpact = useCallback((position) => {
    const impact = { position, time: Date.now(), id: `impact_${Date.now()}_${Math.random()}` };
    setImpactPositions((prev) => [...prev, impact]);
    
    // Clean up after 2 seconds
    setTimeout(() => {
      setImpactPositions((prev) => prev.filter((imp) => imp.id !== impact.id));
    }, 2000);
  }, []);

  return (
    <>
      {axes.map((axe) => (
        <FallingAxe
          key={axe.id}
          id={axe.id}
          startPosition={[axe.startX, axe.startY, axe.startZ]}
          delay={axe.delay}
          nodes={nodes}
          onImpact={handleImpact}
        />
      ))}
      {/* Render impact effects */}
      {impactPositions.map((impact) => (
        <ImpactEffect
          key={impact.id}
          position={[impact.position.x, impact.position.y, impact.position.z]}
        />
      ))}
    </>
  );
};

// Individual Falling Axe Component
const FallingAxe = ({ id, startPosition, delay, nodes, onImpact }) => {
  const rb = useRef();
  const [hasImpacted, setHasImpacted] = useState(false);
  const [spawned, setSpawned] = useState(false);
  const sfxHit = useRef();
  const slowMotionActive = useGame((state) => state.slowMotionActive);
  const timeScale = useGame((state) => state.timeScale);
  
  // Apply gravity scale for slow motion
  useEffect(() => {
    if (rb.current && spawned && !hasImpacted) {
      const baseGravityScale = 2; // Fall faster
      if (slowMotionActive) {
        rb.current.setGravityScale(baseGravityScale * timeScale);
      } else {
        rb.current.setGravityScale(baseGravityScale);
      }
    }
  }, [slowMotionActive, timeScale, spawned, hasImpacted]);
  
  // Apply slow motion to falling axe velocities in useFrame
  useFrame(() => {
    if (rb.current && spawned && !hasImpacted && slowMotionActive) {
      const currentVel = rb.current.linvel();
      if (currentVel) {
        const targetVel = {
          x: currentVel.x * timeScale,
          y: currentVel.y * timeScale,
          z: currentVel.z * timeScale,
        };
        // Smooth interpolation
        rb.current.setLinvel({
          x: currentVel.x + (targetVel.x - currentVel.x) * 0.15,
          y: currentVel.y + (targetVel.y - currentVel.y) * 0.15,
          z: currentVel.z + (targetVel.z - currentVel.z) * 0.15,
        }, true);
      }
      const currentAngVel = rb.current.angvel();
      if (currentAngVel) {
        const targetAngVel = {
          x: currentAngVel.x * timeScale,
          y: currentAngVel.y * timeScale,
          z: currentAngVel.z * timeScale,
        };
        rb.current.setAngvel({
          x: currentAngVel.x + (targetAngVel.x - currentAngVel.x) * 0.15,
          y: currentAngVel.y + (targetAngVel.y - currentAngVel.y) * 0.15,
          z: currentAngVel.z + (targetAngVel.z - currentAngVel.z) * 0.15,
        }, true);
      }
    }
  });

  useEffect(() => {
    // Delay spawn
    const timer = setTimeout(() => {
      setSpawned(true);
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!spawned || !rb.current || hasImpacted) return;

    // Set initial position
    rb.current.setTranslation(
      vec3({ x: startPosition[0], y: startPosition[1], z: startPosition[2] }),
      true
    );
    
    // Make it dynamic and apply downward force
    rb.current.setBodyType(0); // dynamic
    // Gravity scale will be set by useEffect when slow motion changes
    const baseGravityScale = 2; // Fall faster
    rb.current.setGravityScale(slowMotionActive ? baseGravityScale * timeScale : baseGravityScale);
    rb.current.setLinvel({ x: 0, y: -5, z: 0 }, true);
    
    // Add some random rotation
    rb.current.setAngvel({
      x: randFloat(-2, 2),
      y: randFloat(-2, 2),
      z: randFloat(-2, 2),
    }, true);
  }, [spawned, startPosition, hasImpacted, slowMotionActive, timeScale]);

  const handleImpact = useCallback(
    (e) => {
      if (hasImpacted || !rb.current) return;
      
      const otherName = e?.other?.rigidBodyObject?.name;
      
      // Check if collision is with ground
      if (otherName === "ground") {
        const position = rb.current.translation();
        setHasImpacted(true);
        onImpact?.({ x: position.x, y: position.y, z: position.z });
        
        // Stop the axe
        rb.current.setBodyType(2); // kinematic
        rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        
        // Play sound
        if (sfxHit.current) {
          try {
            // Adjust playback rate for slow motion
            if (slowMotionActive && sfxHit.current.source) {
              sfxHit.current.source.playbackRate.value = timeScale;
            }
          } catch (error) {
            // Ignore if audio not ready
          }
          sfxHit.current.stop();
          sfxHit.current.play();
        }
      }
      // Check if collision is with target (regular or giant)
      else if (otherName === "target" || otherName === "giantTarget") {
        setHasImpacted(true);
        // For giant target, multiplier is handled by GiantTarget component
        // For regular target, handle normally
        if (otherName === "target") {
          const onTargetHit = useGame.getState().onTargetHit;
          onTargetHit();
        }
        // Stop the axe
        if (rb.current) {
          rb.current.setBodyType(2); // kinematic
          rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
        // Play sound
        if (sfxHit.current) {
          try {
            if (slowMotionActive && sfxHit.current.source) {
              sfxHit.current.source.playbackRate.value = timeScale;
            }
          } catch (error) {
            // Ignore if audio not ready
          }
          sfxHit.current.stop();
          sfxHit.current.play();
        }
      }
      // Check if collision is with balloon
      else if (otherName?.startsWith("balloon_")) {
        // Axe hits balloon - stop the axe and let balloon handle explosion
        setHasImpacted(true);
        // Don't call onImpact for balloon hits (no ground impact effect needed)
        // Stop the axe
        if (rb.current) {
          rb.current.setBodyType(2); // kinematic
          rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
        // Play sound
        if (sfxHit.current) {
          try {
            // Adjust playback rate for slow motion
            if (slowMotionActive && sfxHit.current.source) {
              sfxHit.current.source.playbackRate.value = timeScale;
            }
          } catch (error) {
            // Ignore if audio not ready
          }
          sfxHit.current.stop();
          sfxHit.current.play();
        }
      }
    },
    [hasImpacted, onImpact, slowMotionActive, timeScale]
  );

  // Fallback: check position if collision doesn't work
  useFrame(() => {
    if (!spawned || !rb.current || hasImpacted) return;
    
    const position = rb.current.translation();
    // Check if hit ground (y < -8.5) as fallback
    if (position.y < -8.5) {
      setHasImpacted(true);
      onImpact?.({ x: position.x, y: -8.5, z: position.z });
      
      // Stop the axe
      rb.current.setBodyType(2); // kinematic
      rb.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rb.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      
      // Play sound
      if (sfxHit.current) {
        try {
          // Adjust playback rate for slow motion
          if (slowMotionActive && sfxHit.current.source) {
            sfxHit.current.source.playbackRate.value = timeScale;
          }
        } catch (error) {
          // Ignore if audio not ready
        }
        sfxHit.current.stop();
        sfxHit.current.play();
      }
    }
  });


  if (!spawned) return null;

  return (
    <group>
      <PositionalAudio
        url={AUDIOS.impact}
        autoplay={false}
        ref={sfxHit}
        loop={false}
        distance={20}
      />
      <RigidBody
        ref={rb}
        name={`bladefall_axe_${id}`}
        type="dynamic"
        colliders={false}
        gravityScale={slowMotionActive ? 2 * timeScale : 2}
        mass={0.5}
        linearDamping={slowMotionActive ? 0.3 + (1.0 - timeScale) * 0.15 : 0.3}
        angularDamping={slowMotionActive ? 0.5 + (1.0 - timeScale) * 0.15 : 0.5}
        onIntersectionEnter={handleImpact}
      >
        <CuboidCollider args={[0.1, 0.3, 0.05]} />
        <group scale={0.5} rotation-y={degToRad(90)}>
          <Gltf src="models/Axe Small.glb" position-y={-0.3} />
        </group>
      </RigidBody>
    </group>
  );
};

// Impact Effect Component - Particles and smoke on ground hit
const ImpactEffect = ({ position }) => {
  return (
    <group position={[position.x, position.y + 0.5, position.z]}>
      {/* Impact sparks */}
      <VFXEmitter
        emitter="sparks"
        settings={{
          spawnMode: "burst",
          nbParticles: 200,
          duration: 0.3,
          size: [0.05, 0.2],
          startPositionMin: [0, 0, 0],
          startPositionMax: [0, 0, 0],
          directionMin: [-1, 0, -1],
          directionMax: [1, 0.5, 1],
          rotationSpeedMin: [-5, -5, -10],
          rotationSpeedMax: [5, 5, 10],
          speed: [2, 8],
          colorStart: ["#FFA500", "#FF6347", "#8B4513"],
          particlesLifetime: [0.3, 1],
        }}
      />
      {/* Smoke effect */}
      <VFXEmitter
        emitter="stars"
        settings={{
          spawnMode: "burst",
          nbParticles: 50,
          duration: 0.5,
          size: [0.2, 0.5],
          startPositionMin: [0, 0, 0],
          startPositionMax: [0, 0, 0],
          directionMin: [-0.5, 0.5, -0.5],
          directionMax: [0.5, 1, 0.5],
          rotationSpeedMin: [0, 0, 0],
          rotationSpeedMax: [1, 1, 1],
          speed: [0.5, 2],
          colorStart: ["#666666", "#888888", "#444444"],
          particlesLifetime: [1, 2],
        }}
      />
    </group>
  );
};
