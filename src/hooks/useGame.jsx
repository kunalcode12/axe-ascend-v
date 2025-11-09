import { MeshStandardMaterial, Vector3 } from "three";
import {
  randFloat,
  randFloatSpread,
  randInt,
} from "three/src/math/MathUtils.js";
import { create } from "zustand";

export const BALLOON_COLORS = ["white", "#b7b0e3", "#5a47ce"];

export const balloonMaterials = {};

BALLOON_COLORS.forEach((color) => {
  balloonMaterials[color] = new MeshStandardMaterial({
    color,
  });
});

export const useGame = create((set, get) => {
  return {
    balloons: [],
    firstGame: true,
    axeLaunched: false,
    balloonsHit: 0,
    targetHit: 0,
    throws: 0,
    arenaPoints: 0, // Points from arena boosts
    monitorOpen: false, // Track if monitor is open
    specialEffectActive: false, // Track if special effect is active
    pointGainQueue: [], // Queue of point gains to show
    bladefallActive: false, // Track if Bladefall effect is active
    cameraShake: false, // Track if camera should shake
    cloneThrowActive: false, // Track if Clone Throw effect is active
    cloneThrowRemainingThrows: 0, // Number of throws remaining with clone effect
    slowMotionActive: false, // Track if Slow Motion effect is active
    timeScale: 1.0, // Global time scale (1.0 = normal, 0.5 = half speed)
    balloonStormActive: false, // Track if Balloon Storm effect is active
    balloonStreak: 0, // Current balloon hit streak
    balloonStormBalloons: [], // Balloons spawned during storm
    balloonStreakTimeout: null, // Timeout for resetting streak
    giantTargetActive: false, // Track if Giant Target effect is active
    giantTargetMultiplier: 1, // Points multiplier for giant target (x2-x5)
    giantTargetTimeRemaining: 0, // Time remaining in seconds
    giantTargetHits: 0, // Number of hits on giant target
    launchAxe: () => {
      // Don't launch axe if monitor is open
      if (get().monitorOpen) {
        return;
      }
      if (get().axeLaunched || get().throws <= 0) {
        return;
      }
      set(() => ({
        axeLaunched: true,
        throws: get().throws - 1,
      }));
      setTimeout(() => {
        set(() => ({
          axeLaunched: false,
        }));
      }, 2000);
    },
    startGame: () => {
      set(() => ({
        firstGame: false,
        axeLaunched: false,
        balloonsHit: 0,
        targetHit: 0,
        throws: 3,
        arenaPoints: 0,
        specialEffectActive: false,
        balloons: new Array(50).fill(0).map((_, index) => ({
          id: `balloon_${index}_${Math.random()}`,
          position: new Vector3(
            randFloat(8, 18),
            randFloat(-20, 0),
            randFloatSpread(1)
          ),
          color: BALLOON_COLORS[randInt(0, BALLOON_COLORS.length - 1)],
        })),
      }));
    },
    addThrow: (count = 1) => {
      set((state) => ({
        throws: state.throws + count,
      }));
    },
    onBalloonHit: () => {
      set((state) => ({
        balloonsHit: state.balloonsHit + 1,
      }));
    },
    onTargetHit: () => {
      set((state) => ({
        targetHit: state.targetHit + 1,
      }));
    },
    setMonitorOpen: (isOpen) => {
      set(() => ({
        monitorOpen: isOpen,
      }));
    },
    addArenaPoints: (points) => {
      set((state) => ({
        arenaPoints: state.arenaPoints + points,
        pointGainQueue: [
          ...state.pointGainQueue,
          {
            id: Date.now() + Math.random(),
            amount: points,
            timestamp: Date.now(),
          },
        ],
      }));
    },
    removePointGain: (id) => {
      set((state) => ({
        pointGainQueue: state.pointGainQueue.filter((p) => p.id !== id),
      }));
    },
    triggerSpecialEffect: () => {
      set(() => ({
        specialEffectActive: true,
      }));
      setTimeout(() => {
        set(() => ({
          specialEffectActive: false,
        }));
      }, 3000); // Special effect lasts 3 seconds
    },
    triggerBladefall: () => {
      set(() => ({
        bladefallActive: true,
        cameraShake: true,
      }));
      // Camera shake duration
      setTimeout(() => {
        set(() => ({
          cameraShake: false,
        }));
      }, 1000); // Shake for 1 second
      // Keep camera view for longer to see the effect (same duration as effect)
      // Bladefall effect duration
      setTimeout(() => {
        set(() => ({
          bladefallActive: false,
        }));
      }, 6000); // Effect lasts 6 seconds (gives time for all axes to fall)
    },
    triggerCloneThrow: (throwsCount = 3) => {
      set(() => ({
        cloneThrowActive: true,
        cloneThrowRemainingThrows: throwsCount,
      }));
    },
    consumeCloneThrow: () => {
      const state = get();
      if (state.cloneThrowActive && state.cloneThrowRemainingThrows > 0) {
        const newRemaining = state.cloneThrowRemainingThrows - 1;
        set(() => ({
          cloneThrowRemainingThrows: newRemaining,
          cloneThrowActive: newRemaining > 0,
        }));
      }
    },
    triggerSlowMotion: (duration = 5, timeScaleValue = 0.5) => {
      set(() => ({
        slowMotionActive: true,
        timeScale: timeScaleValue, // 0.5 = half speed (2x slower)
      }));
      // Disable slow motion after duration
      setTimeout(() => {
        set(() => ({
          slowMotionActive: false,
          timeScale: 1.0,
        }));
      }, duration * 1000); // Convert seconds to milliseconds
    },
    triggerBalloonStorm: (duration = 8, balloonCount = 30) => {
      set(() => ({
        balloonStormActive: true,
        balloonStreak: 0, // Reset streak when storm starts
      }));
      
      // Spawn balloons over the duration
      const spawnInterval = (duration * 1000) / balloonCount; // Spawn balloons evenly over duration
      let spawned = 0;
      
      const spawnBalloons = () => {
        if (spawned < balloonCount && get().balloonStormActive) {
          // Spawn a cluster of balloons
          const clusterSize = Math.min(5, balloonCount - spawned); // Spawn up to 5 at a time
          const newBalloons = new Array(clusterSize).fill(0).map((_, index) => {
            // Spawn in a dense cluster around a random point
            const clusterCenterX = randFloat(-5, 15);
            const clusterCenterY = randFloat(-10, 5);
            const clusterCenterZ = randFloat(-3, 3);
            
            return {
              id: `storm_balloon_${Date.now()}_${spawned + index}_${Math.random()}`,
              position: new Vector3(
                clusterCenterX + randFloatSpread(3), // Dense cluster within 3 units
                clusterCenterY + randFloatSpread(3),
                clusterCenterZ + randFloatSpread(2)
              ),
              color: BALLOON_COLORS[randInt(0, BALLOON_COLORS.length - 1)],
              isStormBalloon: true, // Mark as storm balloon
              points: randInt(1, 3) * 5, // Random points: 5, 10, or 15
              lifetime: duration + randFloat(0, 2), // Balloons last slightly longer than storm
            };
          });
          
          set((state) => ({
            balloons: [...state.balloons, ...newBalloons],
            balloonStormBalloons: [...state.balloonStormBalloons, ...newBalloons.map(b => b.id)],
          }));
          
          spawned += clusterSize;
          
          if (spawned < balloonCount) {
            setTimeout(spawnBalloons, spawnInterval);
          }
        }
      };
      
      // Start spawning
      spawnBalloons();
      
      // End storm after duration
      setTimeout(() => {
        set(() => ({
          balloonStormActive: false,
        }));
        // Clean up storm balloons after a delay
        setTimeout(() => {
          set((state) => ({
            balloons: state.balloons.filter(b => !state.balloonStormBalloons.includes(b.id)),
            balloonStormBalloons: [],
          }));
        }, 2000); // Clean up 2 seconds after storm ends
      }, duration * 1000);
    },
    incrementBalloonStreak: () => {
      const currentStreak = get().balloonStreak;
      set(() => ({
        balloonStreak: currentStreak + 1,
      }));
      
      // Clear any existing timeout
      if (get().balloonStreakTimeout) {
        clearTimeout(get().balloonStreakTimeout);
      }
      
      // Reset streak after 3 seconds of no hits
      const timeoutId = setTimeout(() => {
        set(() => ({
          balloonStreak: 0,
          balloonStreakTimeout: null,
        }));
      }, 3000);
      
      set(() => ({
        balloonStreakTimeout: timeoutId,
      }));
    },
    resetBalloonStreak: () => {
      set(() => ({
        balloonStreak: 0,
      }));
    },
    triggerGiantTarget: (duration = 10, multiplier = 3) => {
      set(() => ({
        giantTargetActive: true,
        giantTargetMultiplier: multiplier,
        giantTargetTimeRemaining: duration,
        giantTargetHits: 0,
      }));
      
      // Update countdown every second
      const countdownInterval = setInterval(() => {
        set((state) => {
          const newTime = state.giantTargetTimeRemaining - 1;
          if (newTime <= 0) {
            clearInterval(countdownInterval);
            return {
              giantTargetActive: false,
              giantTargetTimeRemaining: 0,
              giantTargetMultiplier: 1,
              giantTargetHits: 0,
            };
          }
          return {
            giantTargetTimeRemaining: newTime,
          };
        });
      }, 1000);
      
      // End effect after duration
      setTimeout(() => {
        clearInterval(countdownInterval);
        set(() => ({
          giantTargetActive: false,
          giantTargetTimeRemaining: 0,
          giantTargetMultiplier: 1,
          giantTargetHits: 0,
        }));
      }, duration * 1000);
    },
    incrementGiantTargetHits: () => {
      set((state) => ({
        giantTargetHits: state.giantTargetHits + 1,
      }));
    },
  };
});
