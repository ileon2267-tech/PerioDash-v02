import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Eye, EyeOff, ZoomIn, ZoomOut, Activity, Flame, ShieldAlert, Sparkles, Maximize2, Minimize2 } from "lucide-react";

interface InteractiveTooth3DProps {
  toothNumber: number;
  activeArch: "upper" | "lower";
  showInternalAnatomy: boolean;
  pocketData: { mesial: number; central: number; distal: number };
  recessData: { mesial: number; central: number; distal: number };
  bleedingData: { mesial: boolean; central: boolean; distal: boolean };
  plaqueData: { mesial: boolean; central: boolean; distal: boolean };
  condition?: string;
  inputPosition: "mesial" | "central" | "distal";
  inputSurface: "vestibular" | "palatino";
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Face {
  indices: number[];
  color: string;
  opacity: number;
  isWireframe?: boolean;
  isLine?: boolean;
  lineWidth?: number;
  avgZ?: number;
  type: "crown" | "root" | "pulp" | "bone" | "gum" | "pdl" | "probe" | "implant" | "caries" | "plaque" | "blood" | "fissure" | "pocketLine";
  originalY?: number; // Raw average Y before transformation (for procedural gradients)
  normal?: Point3D;   // Pre-calculated normal vector
}

export default function InteractiveTooth3D({
  toothNumber,
  activeArch,
  showInternalAnatomy,
  pocketData,
  recessData,
  bleedingData,
  plaqueData,
  condition = "sano",
  inputPosition,
  inputSurface,
}: InteractiveTooth3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 3D camera & orbit state
  const [yaw, setYaw] = useState<number>(0.4); // Horizontal rotation
  const [pitch, setPitch] = useState<number>(0.15); // Vertical rotation
  const [zoom, setZoom] = useState<number>(1.15); // Zoom level
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  // Custom interactive speeds and rendering realism styles
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.02); // Faster default speed!
  const [renderingMode, setRenderingMode] = useState<"realistic" | "clinical" | "opalescent">("realistic");

  // Dynamic operatory light rig controls for extreme realism
  const [lightAngle, setLightAngle] = useState<number>(0.0);
  const [autoRotateLight, setAutoRotateLight] = useState<boolean>(true);
  const [wetness, setWetness] = useState<number>(0.85); // High gloss default
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Escape key listener for fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Physics & Inertia
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTime = useRef<number>(0);
  const yawVel = useRef<number>(0);
  const pitchVel = useRef<number>(0);

  // Inertia and physics loop
  useEffect(() => {
    let animationId: number;

    const tick = () => {
      let updated = false;

      if (!isDragging) {
        if (autoRotate) {
          setYaw((prev) => (prev + rotationSpeed) % (Math.PI * 2));
          updated = true;
        }

        if (Math.abs(yawVel.current) > 0.0001) {
          setYaw((prev) => (prev + yawVel.current) % (Math.PI * 2));
          yawVel.current *= 0.93; // dampening
          updated = true;
        }
        if (Math.abs(pitchVel.current) > 0.0001) {
          setPitch((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev + pitchVel.current)));
          pitchVel.current *= 0.93; // dampening
          updated = true;
        }
      }

      if (autoRotateLight) {
        setLightAngle((prev) => (prev + 0.025) % (Math.PI * 2)); // Smooth rotating light
        updated = true;
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [autoRotate, isDragging, rotationSpeed, autoRotateLight]);

  // Tooth Anatomy helper based on FDI notations
  const getToothAnatomy = (num: number) => {
    const isUpper = num <= 28 || (num >= 51 && num <= 65);
    const isMolar = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48].includes(num);
    const isPremolar = [14, 15, 24, 25, 34, 35, 44, 45].includes(num);
    const isCanine = [13, 23, 33, 43].includes(num);
    const isFirstPremolarUpper = [14, 24].includes(num);

    let rootCount = 1;
    let toothType: "incisor" | "canine" | "premolar" | "molar" = "incisor";

    if (isMolar) {
      toothType = "molar";
      rootCount = isUpper ? 3 : 2;
    } else if (isPremolar) {
      toothType = "premolar";
      rootCount = isFirstPremolarUpper ? 2 : 1;
    } else if (isCanine) {
      toothType = "canine";
      rootCount = 1;
    } else {
      toothType = "incisor";
      rootCount = 1;
    }

    return { rootCount, toothType, isUpper };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    lastTime.current = performance.now();
    yawVel.current = 0;
    pitchVel.current = 0;
    setAutoRotate(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastTime.current);

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    yawVel.current = deltaX * 0.004;
    pitchVel.current = deltaY * 0.004;

    setYaw((prev) => prev + deltaX * 0.005);
    setPitch((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev + deltaY * 0.005)));

    dragStart.current = { x: e.clientX, y: e.clientY };
    lastTime.current = now;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches[0]) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      lastTime.current = performance.now();
      yawVel.current = 0;
      pitchVel.current = 0;
      setAutoRotate(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !e.touches[0]) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastTime.current);

    const deltaX = e.touches[0].clientX - dragStart.current.x;
    const deltaY = e.touches[0].clientY - dragStart.current.y;

    yawVel.current = deltaX * 0.003;
    pitchVel.current = deltaY * 0.003;

    setYaw((prev) => prev + deltaX * 0.004);
    setPitch((prev) => Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, prev + deltaY * 0.004)));

    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    lastTime.current = now;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // High DPI Scaling
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    // Redraw high-fidelity medical grade dark gradient background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, "#0b0f19"); // Deeper technical midnight
    bgGrad.addColorStop(1, "#03050a"); // Velvet black
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Fine, professional grid lines
    ctx.strokeStyle = "rgba(45, 212, 191, 0.018)";
    ctx.lineWidth = 1;
    const step = 24;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    // Dynamic radial atmospheric lighting overlay behind the model
    const radialGlow = ctx.createRadialGradient(width / 2, height / 2 - 15, 10, width / 2, height / 2, width * 0.65);
    radialGlow.addColorStop(0, "rgba(20, 184, 166, 0.14)"); // Teal focal highlight
    radialGlow.addColorStop(0.5, "rgba(15, 23, 42, 0.02)");
    radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = radialGlow;
    ctx.fillRect(0, 0, width, height);

    // Render soft ground ambient occlusion contact shadow under the roots/gums
    ctx.save();
    ctx.translate(width / 2, height / 2 + 52);
    const shadowGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, 55);
    shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.62)"); // Intense dark ground contact core
    shadowGrad.addColorStop(0.3, "rgba(0, 0, 0, 0.4)");
    shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = shadowGrad;
    ctx.scale(1.25, 0.35); // flatten to form a realistic floor shadow oval
    ctx.beginPath();
    ctx.arc(0, 0, 55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const { rootCount, toothType, isUpper } = getToothAnatomy(toothNumber);
    const dir = activeArch === "upper" ? 1 : -1;
    const crownHeight = 35 * dir;
    const rootHeight = -56 * dir;

    const vertices: Point3D[] = [];
    const faces: Face[] = [];

    const addVertex = (p: Point3D): number => {
      vertices.push(p);
      return vertices.length - 1;
    };

    // Quad Ring Builder
    const buildQuadRings = (
      ringA: number,
      ringB: number,
      size: number,
      color: string,
      opacity: number,
      type: Face["type"]
    ) => {
      for (let i = 0; i < size; i++) {
        const next = (i + 1) % size;
        faces.push({
          indices: [ringA + i, ringA + next, ringB + next, ringB + i],
          color,
          opacity,
          type,
        });
      }
    };

    // Cap Ring Builder
    const buildCapRing = (
      ringOffset: number,
      size: number,
      color: string,
      opacity: number,
      type: Face["type"],
      reverse = false
    ) => {
      let cx = 0, cy = 0, cz = 0;
      for (let i = 0; i < size; i++) {
        const v = vertices[ringOffset + i];
        cx += v.x; cy += v.y; cz += v.z;
      }
      cx /= size; cy /= size; cz /= size;
      const centerIndex = addVertex({ x: cx, y: cy, z: cz });

      for (let i = 0; i < size; i++) {
        const next = (i + 1) % size;
        faces.push({
          indices: reverse
            ? [centerIndex, ringOffset + next, ringOffset + i]
            : [centerIndex, ringOffset + i, ringOffset + next],
          color,
          opacity,
          type,
        });
      }
    };

    const isImplant = condition === "implante";

    // ----------------- 1. HIGH-FIDELITY SCULPTED ENAMEL CROWN -----------------
    // High-resolution parameters: 24 segments per ring and 10 vertical segments
    const crownRings = 10; 
    const vertsPerRing = 24;
    const crownRingIndices: number[] = [];

    for (let r = 0; r < crownRings; r++) {
      const ringRatio = r / (crownRings - 1);
      const yVal = crownHeight * ringRatio;
      const ringStart = vertices.length;
      crownRingIndices.push(ringStart);

      // Anatomical shape profiling curves according to tooth type
      let rx = 13.0;
      let rz = 12.0;

      if (toothType === "molar") {
        // Molars are bulbous and cuboidal with rounded corners, tapered at the neck and slightly at occlusal surface
        rx = 14.8 * (0.8 + 0.26 * Math.sin(ringRatio * Math.PI));
        rz = 14.0 * (0.8 + 0.26 * Math.sin(ringRatio * Math.PI));
        if (r === 0) { rx = 11.2; rz = 10.6; } // Cervical constriction neck
        else if (r === 9) { rx = 11.8; rz = 11.2; } // Occlusal table contour
      } else if (toothType === "premolar") {
        // Premolars are oval, thicker in the buccolingual (Z) dimension than mesiodistal (X)
        rx = 11.8 * (0.82 + 0.22 * Math.sin(ringRatio * Math.PI));
        rz = 13.2 * (0.82 + 0.22 * Math.sin(ringRatio * Math.PI));
        if (r === 0) { rx = 9.2; rz = 10.2; }
        else if (r === 9) { rx = 9.6; rz = 11.0; }
      } else if (toothType === "incisor") {
        // Incisors are wedge-shaped: broad mesiodistally, flat labiolingually, transitioning to a chisel edge
        rx = 9.5 * (1 - ringRatio) + 15.6 * ringRatio;
        rz = 9.2 * (1 - ringRatio) + 1.8 * ringRatio;
        // Palatal cingulum bulge at the cervical third
        if (r === 1 || r === 2 || r === 3) {
          rz += 1.8;
        }
      } else if (toothType === "canine") {
        // Canines are thick, robust, diamond/spear-shaped with high contour labiolingually
        rx = 10.0 * (1 - ringRatio * 0.15) + 3.2 * Math.sin(ringRatio * Math.PI);
        rz = 10.8 * (1 - ringRatio * 0.1) + 3.8 * Math.sin(ringRatio * Math.PI);
        if (r === 0) { rx = 9.5; rz = 9.5; }
        else if (r === 9) { rx = 6.8; rz = 8.2; }
      }

      for (let i = 0; i < vertsPerRing; i++) {
        const angle = (i * Math.PI * 2) / vertsPerRing;
        let vx = Math.cos(angle) * rx;
        let vz = Math.sin(angle) * rz;
        let vy = yVal;

        // Apply authentic organ-level tooth shapes
        if (r === crownRings - 1) {
          if (toothType === "molar") {
            // Highly detailed molar relief grooves: 4 prominent cusp structures
            const cuspMultiplier = Math.sin(angle * 4) * 3.8 * dir;
            vy += cuspMultiplier;
            // developmental central fissure indentations
            if (i % 6 === 1 || i % 6 === 4) {
              vx *= 0.82;
              vz *= 0.82;
            }
          } else if (toothType === "premolar") {
            // Bicuspid ridge (buccal cusp taller and more prominent)
            const bicuspidWave = Math.cos(angle * 2) * 2.8 * dir;
            vy += bicuspidWave;
            // Buccal cusp (angle close to 0) dominates over lingual cusp
            if (Math.cos(angle) > 0) {
              vy += 1.3 * dir;
            }
          } else if (toothType === "incisor") {
            // Wedge shaped profile (thin incisal edge, broad width)
            vz *= 0.12; 
            vx *= 1.52; 
            // Palatal cingulum bulging anatomy on the inside
            if (Math.sin(angle) < 0) {
              vz -= 2.8 * dir;
            }
            // Real mamelon edge ripples on the incisal border
            const ripple = Math.sin(angle * 6) * 0.6 * dir;
            vy += ripple;
          } else if (toothType === "canine") {
            // Robust canine eminence and sharp single cusp spear
            const canineCusp = Math.cos(angle) * 4.2 * dir;
            vy += canineCusp;
            vz *= 0.48;
            vx *= 1.22;
          }
        }

        // Add subtle biological micro-asymmetry to avoid the robotic look
        const organicNoise = Math.sin(angle * 6 + r) * 0.22;
        vx += organicNoise;
        vz += organicNoise;

        addVertex({ x: vx, y: vy, z: vz });
      }
    }

    // Generate Crown Faces with high-fidelity "gradient-crown" markers
    for (let r = 0; r < crownRings - 1; r++) {
      buildQuadRings(
        crownRingIndices[r],
        crownRingIndices[r + 1],
        vertsPerRing,
        "gradient-crown",
        0.98,
        "crown"
      );
    }

    // Crown Cusp/Incisal Cap
    buildCapRing(
      crownRingIndices[crownRings - 1],
      vertsPerRing,
      "gradient-crown-cap",
      0.98,
      "crown",
      activeArch === "upper"
    );

    // Anatomical fissures and developmental stains
    if (toothType === "molar" || toothType === "premolar") {
      const topCenterIndex = vertices.length - 1;
      const fissureColor = "#702c11"; // Real biological amber developmental grooves
      for (let i = 0; i < vertsPerRing; i += 3) {
        faces.push({
          indices: [topCenterIndex, crownRingIndices[crownRings - 1] + i, crownRingIndices[crownRings - 1] + ((i + 1) % vertsPerRing)],
          color: fissureColor,
          opacity: 0.85,
          type: "fissure",
        });
      }
    }

    // Caries indicator: Demineralization zone with necrotic brown core
    if (condition === "caries") {
      const topCenterIdx = vertices.length - 1;
      const cariesCoreColor = "#1a0802"; // Necrotic brown/black
      const demineralizationHalo = "#d97706"; // Demineralized enamel amber halo
      
      faces.push({
        indices: [topCenterIdx, crownRingIndices[crownRings - 1] + 3, crownRingIndices[crownRings - 1] + 8],
        color: cariesCoreColor,
        opacity: 1.0,
        type: "caries",
      });
      // Soft collar demineralization
      for (let i = 0; i < 6; i++) {
        faces.push({
          indices: [
            crownRingIndices[crownRings - 1] + i,
            crownRingIndices[crownRings - 1] + ((i + 1) % vertsPerRing),
            crownRingIndices[crownRings - 2] + ((i + 1) % vertsPerRing),
            crownRingIndices[crownRings - 2] + i,
          ],
          color: demineralizationHalo,
          opacity: 0.95,
          type: "caries",
        });
      }
    }

    // Biofilm Plaque (Bacterial plaque along the cervical margin)
    const hasPlaque = plaqueData.mesial || plaqueData.central || plaqueData.distal;
    if (hasPlaque) {
      const plaqueColor = "rgba(180, 132, 22, 0.92)"; // textured yellowish fuzzy plaque
      for (let i = 0; i < vertsPerRing; i++) {
        const isM = i >= Math.floor(vertsPerRing * 11 / 16);
        const isC = i >= Math.floor(vertsPerRing * 5 / 16) && i < Math.floor(vertsPerRing * 11 / 16);
        const isD = i < Math.floor(vertsPerRing * 5 / 16);

        if (
          (isM && plaqueData.mesial) ||
          (isC && plaqueData.central) ||
          (isD && plaqueData.distal)
        ) {
          const next = (i + 1) % vertsPerRing;
          faces.push({
            indices: [
              crownRingIndices[0] + i,
              crownRingIndices[0] + next,
              crownRingIndices[1] + next,
              crownRingIndices[1] + i,
            ],
            color: plaqueColor,
            opacity: 0.95,
            type: "plaque",
          });
        }
      }
    }

    // ----------------- 2. ROOTS / PROSTHETIC TITANIUM IMPLANT -----------------
    if (isImplant) {
      // Machined titanium implant screw
      const implantRings = 9;
      const implantRingIndices: number[] = [];
      const rootRadius = 7.8;

      for (let r = 0; r < implantRings; r++) {
        const ratio = r / (implantRings - 1);
        const yVal = rootHeight * ratio * 0.9;
        const ringStart = vertices.length;
        implantRingIndices.push(ringStart);

        const threadFactor = r % 2 === 0 ? 1.05 : 0.85;
        const rCurrent = rootRadius * threadFactor * (1.0 - ratio * 0.25);

        for (let i = 0; i < vertsPerRing; i++) {
          const angle = (i * Math.PI * 2) / vertsPerRing;
          addVertex({
            x: Math.cos(angle) * rCurrent,
            y: yVal,
            z: Math.sin(angle) * rCurrent,
          });
        }
      }

      // Titanium body walls
      for (let r = 0; r < implantRings - 1; r++) {
        buildQuadRings(
          implantRingIndices[r],
          implantRingIndices[r + 1],
          vertsPerRing,
          "#5a6675", // Titanium slate
          0.98,
          "implant"
        );
      }

      // Golden abutment collar
      const abutmentGold = "#c084fc"; // gold tone placeholder (will shade yellow)
      const abutmentStart = vertices.length;
      for (let i = 0; i < vertsPerRing; i++) {
        const angle = (i * Math.PI * 2) / vertsPerRing;
        addVertex({
          x: Math.cos(angle) * 9.5,
          y: rootHeight * 0.08,
          z: Math.sin(angle) * 9.5,
        });
      }

      // Connections
      for (let i = 0; i < vertsPerRing; i++) {
        const next = (i + 1) % vertsPerRing;
        faces.push({
          indices: [
            crownRingIndices[0] + i,
            crownRingIndices[0] + next,
            abutmentStart + next,
            abutmentStart + i,
          ],
          color: "rgb(202, 138, 4)", // Gold abutment
          opacity: 1.0,
          type: "implant",
        });
      }

      for (let i = 0; i < vertsPerRing; i++) {
        const next = (i + 1) % vertsPerRing;
        faces.push({
          indices: [
            abutmentStart + i,
            abutmentStart + next,
            implantRingIndices[0] + next,
            implantRingIndices[0] + i,
          ],
          color: "#94a3b8", // prosthetic ring collar
          opacity: 1.0,
          type: "implant",
        });
      }

    } else {
      // Natural roots branches
      const rootBranches: { centerX: number; centerZ: number; dirX: number; dirZ: number }[] = [];

      if (rootCount === 1) {
        rootBranches.push({ centerX: 0, centerZ: 0, dirX: 1.8 * dir, dirZ: -0.5 * dir });
      } else if (rootCount === 2) {
        rootBranches.push({ centerX: -6.5, centerZ: 0, dirX: -3.0 * dir, dirZ: 0 });
        rootBranches.push({ centerX: 6.5, centerZ: 0, dirX: 3.0 * dir, dirZ: 0 });
      } else if (rootCount === 3) {
        rootBranches.push({ centerX: 0, centerZ: 6.8, dirX: 0, dirZ: 5.2 * dir });
        rootBranches.push({ centerX: -5.8, centerZ: -4.5, dirX: -3.5 * dir, dirZ: -2.0 * dir });
        rootBranches.push({ centerX: 5.8, centerZ: -4.5, dirX: 3.5 * dir, dirZ: -2.0 * dir });
      }

      rootBranches.forEach((branch, bIdx) => {
        const rootRings = 8; // high res root segments
        const rVerts = 12;
        const rootIndices: number[] = [];
        const isPalatal = rootCount === 3 && bIdx === 0;

        for (let r = 0; r < rootRings; r++) {
          const ratio = r / (rootRings - 1);
          const yVal = rootHeight * ratio;
          const ringStart = vertices.length;
          rootIndices.push(ringStart);

          const scale = isPalatal ? 1.3 : 1.0;
          let rx = 8.5 * scale * (1.0 - ratio * 0.85);
          let rz = 7.5 * scale * (1.0 - ratio * 0.85);

          if (r === 0) {
            rx = 10.0 * scale; rz = 9.0 * scale;
          } else if (r === rootRings - 1) {
            rx = 1.3; rz = 1.1;
          }

          const curveX = branch.centerX + Math.pow(ratio, 1.8) * branch.dirX;
          const curveZ = branch.centerZ + Math.pow(ratio, 1.8) * branch.dirZ;

          for (let i = 0; i < rVerts; i++) {
            const angle = (i * Math.PI * 2) / rVerts;
            const groove = Math.cos(angle * 2) * 0.4 * (1.0 - ratio * 0.5);
            addVertex({
              x: curveX + Math.cos(angle) * (rx - groove),
              y: yVal,
              z: curveZ + Math.sin(angle) * (rz - groove),
            });
          }
        }

        // Root walls
        for (let r = 0; r < rootRings - 1; r++) {
          buildQuadRings(
            rootIndices[r],
            rootIndices[r + 1],
            rVerts,
            "gradient-root",
            0.98,
            "root"
          );
        }

        // Apex caps
        buildCapRing(
          rootIndices[rootRings - 1],
          rVerts,
          "#c8aa7d", // cementum cap
          0.98,
          "root",
          activeArch === "lower"
        );

        // Connections to cervical neck
        if (rootCount === 1) {
          for (let i = 0; i < rVerts; i++) {
            const next = (i + 1) % rVerts;
            const crownI = Math.floor((i * vertsPerRing) / rVerts);
            const crownNext = Math.floor((next * vertsPerRing) / rVerts);

            faces.push({
              indices: [
                crownRingIndices[0] + crownI,
                crownRingIndices[0] + crownNext,
                rootIndices[0] + next,
                rootIndices[0] + i,
              ],
              color: "gradient-root",
              opacity: 0.98,
              type: "root",
            });
          }
        } else {
          // Multi-root trunk bifurcation logic
          const stepOffset = Math.floor(vertsPerRing / rootCount);
          for (let i = 0; i < rVerts; i++) {
            const next = (i + 1) % rVerts;
            const crownI = (i + bIdx * stepOffset) % vertsPerRing;
            const crownNext = (next + bIdx * stepOffset) % vertsPerRing;

            faces.push({
              indices: [
                crownRingIndices[0] + crownI,
                crownRingIndices[0] + crownNext,
                rootIndices[0] + next,
                rootIndices[0] + i,
              ],
              color: "gradient-root",
              opacity: 0.98,
              type: "root",
            });
          }
        }

        // ----------------- 3. INTERNAL ANATOMY: PULP CAVITY & CANALS -----------------
        if (showInternalAnatomy) {
          const pulpColor = "rgba(225, 29, 72, 0.9)"; // Crimson vascular pulp
          const pulpIndices: number[] = [];

          for (let r = 0; r < rootRings; r++) {
            const ratio = r / (rootRings - 1);
            const yVal = rootHeight * ratio * 0.94;
            const ringStart = vertices.length;
            pulpIndices.push(ringStart);

            const rx = 2.2 * (1.0 - ratio * 0.78);
            const rz = 2.0 * (1.0 - ratio * 0.78);

            const curveX = branch.centerX * 0.85 + Math.pow(ratio, 1.8) * branch.dirX * 0.88;
            const curveZ = branch.centerZ * 0.85 + Math.pow(ratio, 1.8) * branch.dirZ * 0.88;

            for (let i = 0; i < 6; i++) {
              const angle = (i * Math.PI * 2) / 6;
              addVertex({
                x: curveX + Math.cos(angle) * rx,
                y: yVal,
                z: curveZ + Math.sin(angle) * rz,
              });
            }
          }

          // Root canal tubes
          for (let r = 0; r < rootRings - 1; r++) {
            buildQuadRings(
              pulpIndices[r],
              pulpIndices[r + 1],
              6,
              pulpColor,
              0.88,
              "pulp"
            );
          }

          // Pulp chamber
          const chamberStart = vertices.length;
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            addVertex({
              x: Math.cos(angle) * 4.0,
              y: crownHeight * 0.28,
              z: Math.sin(angle) * 3.5,
            });
          }

          // Connect
          for (let i = 0; i < 6; i++) {
            const next = (i + 1) % 6;
            faces.push({
              indices: [
                chamberStart + i,
                chamberStart + next,
                pulpIndices[0] + next,
                pulpIndices[0] + i,
              ],
              color: pulpColor,
              opacity: 0.88,
              type: "pulp",
            });
          }

          // Gutta-percha orange obturation for Endodontics (Conducto sellado)
          if (condition === "endodoncia") {
            const guttaPerchaColor = "rgba(249, 115, 22, 1.0)"; 
            const fillStart = vertices.length;

            for (let r = 0; r < rootRings; r++) {
              const ratio = r / (rootRings - 1);
              const yVal = rootHeight * ratio * 0.95;
              const curveX = branch.centerX * 0.85 + Math.pow(ratio, 1.8) * branch.dirX * 0.88;
              const curveZ = branch.centerZ * 0.85 + Math.pow(ratio, 1.8) * branch.dirZ * 0.88;

              addVertex({ x: curveX, y: yVal, z: curveZ });
            }

            for (let r = 0; r < rootRings - 1; r++) {
              faces.push({
                indices: [fillStart + r, fillStart + r + 1],
                color: guttaPerchaColor,
                opacity: 1.0,
                isLine: true,
                lineWidth: 2.8,
                type: "pulp",
              });
            }
          }
        }

        // ----------------- 4. PERIODONTAL LIGAMENT (PDL) SHIELD -----------------
        if (showInternalAnatomy) {
          const pdlColor = "rgba(6, 182, 212, 0.35)"; // Cyan protective fiber sheath
          const pdlIndices: number[] = [];

          for (let r = 0; r < rootRings; r++) {
            const ratio = r / (rootRings - 1);
            const yVal = rootHeight * ratio;
            const ringStart = vertices.length;
            pdlIndices.push(ringStart);

            const scale = isPalatal ? 1.3 : 1.0;
            const rx = (8.5 * scale * (1.0 - ratio * 0.85)) + 0.8;
            const rz = (7.5 * scale * (1.0 - ratio * 0.85)) + 0.8;

            const curveX = branch.centerX + Math.pow(ratio, 1.8) * branch.dirX;
            const curveZ = branch.centerZ + Math.pow(ratio, 1.8) * branch.dirZ;

            for (let i = 0; i < 8; i++) {
              const angle = (i * Math.PI * 2) / 8;
              addVertex({
                x: curveX + Math.cos(angle) * rx,
                y: yVal,
                z: curveZ + Math.sin(angle) * rz,
              });
            }
          }

          for (let r = 0; r < rootRings - 1; r++) {
            buildQuadRings(
              pdlIndices[r],
              pdlIndices[r + 1],
              8,
              pdlColor,
              0.35,
              "pdl"
            );
          }
        }
      });
    }

    // ----------------- 5. ALVEOLAR BONE SOCKET & CREST (Hueso Alveolar) -----------------
    const scaleFactor = 4.4; 

    const boneM = (recessData.mesial + 1.2) * scaleFactor * -dir;
    const boneC = (recessData.central + 1.2) * scaleFactor * -dir;
    const boneD = (recessData.distal + 1.2) * scaleFactor * -dir;

    const boneRings = 12;
    const boneIndices: number[] = [];

    const boneCrestStart = vertices.length;
    boneIndices.push(boneCrestStart);

    const boneWidthX = 21.0;
    const boneDepthZ = 15.5;

    const getBoneCrestY = (angle: number) => {
      const cos = Math.cos(angle);
      if (cos < -0.35) return boneM; 
      if (cos > 0.35) return boneD;  
      return boneC;                  
    };

    // Alveolar crest collar
    for (let i = 0; i < boneRings; i++) {
      const angle = (i * Math.PI * 2) / boneRings;
      const vx = Math.cos(angle) * boneWidthX;
      const vz = Math.sin(angle) * boneDepthZ;
      const vy = getBoneCrestY(angle);
      addVertex({ x: vx, y: vy, z: vz });
    }

    // Alveolar base encasement
    const boneBaseStart = vertices.length;
    boneIndices.push(boneBaseStart);
    const boneBaseY = rootHeight * 1.05;

    for (let i = 0; i < boneRings; i++) {
      const angle = (i * Math.PI * 2) / boneRings;
      const vx = Math.cos(angle) * boneWidthX * 1.12;
      const vz = Math.sin(angle) * boneDepthZ * 1.12;
      addVertex({ x: vx, y: boneBaseY, z: vz });
    }

    // Bone block faces: Spongy trabecular bone color
    const boneColor = "rgba(182, 112, 42, 0.16)"; 
    buildQuadRings(
      boneCrestStart,
      boneBaseStart,
      boneRings,
      boneColor,
      0.16,
      "bone"
    );

    // Bone Crest Line
    const boneLineColor = "rgba(234, 179, 8, 0.85)"; 
    for (let i = 0; i < boneRings; i++) {
      const next = (i + 1) % boneRings;
      faces.push({
        indices: [boneCrestStart + i, boneCrestStart + next],
        color: boneLineColor,
        opacity: 0.85,
        isLine: true,
        lineWidth: 2.0,
        type: "bone",
      });
    }

    // Bone base cap
    buildCapRing(
      boneBaseStart,
      boneRings,
      "rgba(115, 65, 10, 0.4)",
      0.4,
      "bone",
      activeArch === "upper"
    );

    // ----------------- 6. ORGANIC RESPONSIVE GINGIVAL COLLAR (Encía) -----------------
    const gumM = recessData.mesial * scaleFactor * -dir;
    const gumC = recessData.central * scaleFactor * -dir;
    const gumD = recessData.distal * scaleFactor * -dir;

    const gumCrestStart = vertices.length;
    const gumRings = 16; // high res gum structure

    const getGumCrestY = (angle: number) => {
      const cos = Math.cos(angle);
      if (cos < -0.35) return gumM; 
      if (cos > 0.35) return gumD;  
      return gumC;                  
    };

    const isInflamed = pocketData[inputPosition] >= 4 || bleedingData[inputPosition];
    const gumThickness = isInflamed ? 15.0 : 12.6; 

    // Gingival margin collar top
    for (let i = 0; i < gumRings; i++) {
      const angle = (i * Math.PI * 2) / gumRings;
      const vx = Math.cos(angle) * gumThickness;
      const vz = Math.sin(angle) * (gumThickness - 0.8);
      const vy = getGumCrestY(angle);
      addVertex({ x: vx, y: vy, z: vz });
    }

    // Attached gingiva flare base
    const gumBaseStart = vertices.length;
    for (let i = 0; i < gumRings; i++) {
      const angle = (i * Math.PI * 2) / gumRings;
      const vx = Math.cos(angle) * (gumThickness + 3.2);
      const vz = Math.sin(angle) * (gumThickness + 1.8);
      const vy = getGumCrestY(angle) + (4.0 * -dir);
      addVertex({ x: vx, y: vy, z: vz });
    }

    // Double-tone clinical color marker
    // During render, we will construct a high-fidelity linear gradient per face
    const activeGumColor = isInflamed ? "rgba(190, 24, 74, 0.65)" : "rgba(244, 95, 125, 0.35)";

    buildQuadRings(
      gumCrestStart,
      gumBaseStart,
      gumRings,
      activeGumColor,
      isInflamed ? 0.65 : 0.35,
      "gum"
    );

    // Glowing sulcular margin border
    const healthyGumLine = "#f43f5e";
    const inflamedGumLine = "#be123c"; 
    const activeGumLine = isInflamed ? inflamedGumLine : healthyGumLine;

    for (let i = 0; i < gumRings; i++) {
      const next = (i + 1) % gumRings;
      faces.push({
        indices: [gumCrestStart + i, gumCrestStart + next],
        color: activeGumLine,
        opacity: 0.95,
        isLine: true,
        lineWidth: isInflamed ? 2.6 : 1.8,
        type: "gum",
      });
    }

    // ----------------- 7. GRADUATED METALLIC PCP-15 CLINICAL PROBE -----------------
    let probeX = 0;
    let probeZ = -12.0; 
    if (inputSurface === "palatino") {
      probeZ = 12.0; 
    }

    if (inputPosition === "mesial") {
      probeX = -13.5; probeZ = 0;
    } else if (inputPosition === "distal") {
      probeX = 13.5; probeZ = 0;
    }

    const pocketVal = pocketData[inputPosition];
    const recessVal = recessData[inputPosition];
    const probeTipY = (recessVal + pocketVal) * scaleFactor * -dir;

    const probeLen = 110;
    const probeStartY = probeTipY - (probeLen * -dir);

    const probeRadius = 1.2;
    const probeSides = 6;

    const buildProbeSegment = (
      yBot: number,
      yTop: number,
      color: string,
      opacity: number
    ) => {
      const botStart = vertices.length;
      for (let i = 0; i < probeSides; i++) {
        const angle = (i * Math.PI * 2) / probeSides;
        addVertex({
          x: probeX + Math.cos(angle) * probeRadius,
          y: yBot,
          z: probeZ + Math.sin(angle) * probeRadius,
        });
      }

      const topStart = vertices.length;
      for (let i = 0; i < probeSides; i++) {
        const angle = (i * Math.PI * 2) / probeSides;
        addVertex({
          x: probeX + Math.cos(angle) * probeRadius,
          y: yTop,
          z: probeZ + Math.sin(angle) * probeRadius,
        });
      }

      buildQuadRings(
        botStart,
        topStart,
        probeSides,
        color,
        opacity,
        "probe"
      );
    };

    const p1 = probeTipY - (3 * scaleFactor * -dir);
    const p2 = probeTipY - (6 * scaleFactor * -dir);
    const p3 = probeTipY - (9 * scaleFactor * -dir);
    const p4 = probeTipY - (12 * scaleFactor * -dir);
    const p5 = probeTipY - (15 * scaleFactor * -dir);

    buildProbeSegment(probeTipY, p1, "#cbd5e1", 0.98); // silver tip
    buildProbeSegment(p1, p2, "#0f172a", 0.98);        // black band
    buildProbeSegment(p2, p3, "#cbd5e1", 0.98);        // silver band
    buildProbeSegment(p3, p4, "#0f172a", 0.98);        // black band
    buildProbeSegment(p4, p5, "#cbd5e1", 0.98);        // silver band
    buildProbeSegment(p5, probeStartY, "#475569", 0.92); // steel handle

    // ----------------- 8. BLEEDING ON PROBING (BOP) LIQUID DRIPS -----------------
    const isBleeding = bleedingData[inputPosition];
    if (isBleeding) {
      const bloodCrimson = "#e11d48"; 
      const dripCount = 3;

      for (let d = 0; d < dripCount; d++) {
        const dripY = probeTipY + (d * 4.5 * dir);
        const dripX = probeX + Math.sin(d * 2.0) * 1.5;
        const dripZ = probeZ + Math.cos(d * 2.0) * 1.5;

        const startIdx = vertices.length;
        addVertex({ x: dripX, y: dripY - (2.2 * dir), z: dripZ }); // top peak
        addVertex({ x: dripX - 1.5, y: dripY, z: dripZ });        // left
        addVertex({ x: dripX + 1.5, y: dripY, z: dripZ });        // right
        addVertex({ x: dripX, y: dripY, z: dripZ - 1.5 });        // back
        addVertex({ x: dripX, y: dripY, z: dripZ + 1.5 });        // front
        addVertex({ x: dripX, y: dripY + (2.2 * dir), z: dripZ }); // bottom peak

        faces.push(
          { indices: [startIdx, startIdx + 1, startIdx + 3], color: bloodCrimson, opacity: 0.95, type: "blood" },
          { indices: [startIdx, startIdx + 3, startIdx + 2], color: bloodCrimson, opacity: 0.95, type: "blood" },
          { indices: [startIdx, startIdx + 2, startIdx + 4], color: bloodCrimson, opacity: 0.95, type: "blood" },
          { indices: [startIdx, startIdx + 4, startIdx + 1], color: bloodCrimson, opacity: 0.95, type: "blood" },
          { indices: [startIdx + 5, startIdx + 3, startIdx + 1], color: bloodCrimson, opacity: 0.95, type: "blood" },
          { indices: [startIdx + 5, startIdx + 2, startIdx + 3], color: bloodCrimson, opacity: 0.95, type: "blood" },
          { indices: [startIdx + 5, startIdx + 4, startIdx + 2], color: bloodCrimson, opacity: 0.95, type: "blood" },
          { indices: [startIdx + 5, startIdx + 1, startIdx + 4], color: bloodCrimson, opacity: 0.95, type: "blood" }
        );
      }
    }

    // =========================================================================
    //             3D VERTEX NORMALS & TRANSFORMATION PIPELINE
    // =========================================================================

    const camDistance = 175;
    const baseProjScale = 180;
    const currentScale = baseProjScale * zoom;

    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch);
    const sinX = Math.sin(pitch);

    // 1. Calculate vertex normals (for Gouraud Smooth Shading)
    const vertexNormals: Point3D[] = Array.from({ length: vertices.length }, () => ({ x: 0, y: 0, z: 0 }));

    faces.forEach((face) => {
      if (face.isLine || face.indices.length < 3) return;
      const p0 = vertices[face.indices[0]];
      const p1 = vertices[face.indices[1]];
      const p2 = vertices[face.indices[2]];

      const ux = p1.x - p0.x, uy = p1.y - p0.y, uz = p1.z - p0.z;
      const vx = p2.x - p0.x, vy = p2.y - p0.y, vz = p2.z - p0.z;

      let nx = uy * vz - uz * vy;
      let ny = uz * vx - ux * vz;
      let nz = ux * vy - uy * vx;

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      if (len > 0) {
        nx /= len; ny /= len; nz /= len;
        face.normal = { x: nx, y: ny, z: nz };
        face.indices.forEach((idx) => {
          vertexNormals[idx].x += nx;
          vertexNormals[idx].y += ny;
          vertexNormals[idx].z += nz;
        });
      }
    });

    // Normalize vertex normals
    const normalizedVertexNormals = vertexNormals.map((vn) => {
      const len = Math.sqrt(vn.x * vn.x + vn.y * vn.y + vn.z * vn.z);
      return len > 0 ? { x: vn.x / len, y: vn.y / len, z: vn.z / len } : { x: 0, y: 1, z: 0 };
    });

    // 2. Project and transform coordinates (with yaw and pitch camera rotations)
    const rotatedVertices = vertices.map((v) => {
      // Yaw (horizontal)
      const x1 = v.x * cosY - v.z * sinY;
      const z1 = v.x * sinY + v.z * cosY;

      // Pitch (vertical)
      const y2 = v.y * cosX - z1 * sinX;
      const z2 = v.y * sinX + z1 * cosX;

      return { x: x1, y: y2, z: z2 };
    });

    // Rotate vertex normals accordingly to keep lighting relative to viewport
    const rotatedVertexNormals = normalizedVertexNormals.map((vn) => {
      const x1 = vn.x * cosY - vn.z * sinY;
      const z1 = vn.x * sinY + vn.z * cosY;
      const y2 = vn.y * cosX - z1 * sinX;
      const z2 = vn.y * sinX + z1 * cosX;
      return { x: x1, y: y2, z: z2 };
    });

    // Compute average depth and original Y position of each face for sorting & procedural shaders
    faces.forEach((face) => {
      let sumZ = 0;
      let sumOrigY = 0;
      face.indices.forEach((idx) => {
        sumZ += rotatedVertices[idx].z;
        sumOrigY += vertices[idx].y;
      });
      face.avgZ = sumZ / face.indices.length;
      face.originalY = sumOrigY / face.indices.length;
    });

    // Sort by depth (Painter's Algorithm)
    faces.sort((a, b) => (b.avgZ || 0) - (a.avgZ || 0));

    // CLINICAL LIGHTING RIG:
    // 1. Key Light (Operatory dental headlamp): Intense warm-white spotlight, rotating horizontally based on lightAngle
    const keyCos = Math.cos(lightAngle);
    const keySin = Math.sin(lightAngle);
    const keyLightDir = {
      x: 0.55 * keyCos - 0.52 * keySin,
      y: -0.65,
      z: 0.55 * keySin + 0.52 * keyCos
    };
    const keyIntensity = 0.94;

    // 2. Fill Light (Soft bounce panel): Gentle cool bluish panel, bottom-right-back
    const fillLightDir = { x: -0.6, y: 0.5, z: 0.62 };
    const fillIntensity = 0.35;

    // 3. Rim Light (Edge halo highlight): Medium intensity back lighting
    const rimLightDir = { x: -0.1, y: -0.8, z: 0.6 };
    const rimIntensity = 0.55;

    const normVector = (l: { x: number; y: number; z: number }) => {
      const len = Math.sqrt(l.x * l.x + l.y * l.y + l.z * l.z);
      return { x: l.x / len, y: l.y / len, z: l.z / len };
    };

    const key = normVector(keyLightDir);
    const fill = normVector(fillLightDir);
    const rim = normVector(rimLightDir);

    // High fidelity vertex shading calculator
    const shadeVertex = (baseColor: string, normal: Point3D, origY: number, type: string) => {
      // Wrap-around lighting to simulate Subsurface Scattering (SSS) inside organic tooth/bone tissue
      const wrapKey = Math.max(0, (normal.x * key.x + normal.y * key.y + normal.z * key.z) * 0.78 + 0.22);
      const diffKey = wrapKey * keyIntensity;
      const diffFill = Math.max(0, normal.x * fill.x + normal.y * fill.y + normal.z * fill.z) * fillIntensity;
      const diffRim = Math.max(0, normal.x * rim.x + normal.y * rim.y + normal.z * rim.z) * rimIntensity;

      // Soft backscatter / subsurface translucency scattering (warm crimson dentin undertone)
      const sssStrength = renderingMode === "realistic" ? 0.28 : renderingMode === "opalescent" ? 0.38 : 0.16;
      const sssFactor = Math.max(0, -normal.x * key.x - normal.y * key.y - normal.z * key.z) * sssStrength;

      // Phong Specular highlights
      const viewVec = { x: 0, y: 0, z: -1 };
      const reflectX = 2 * (normal.x * key.x + normal.y * key.y + normal.z * key.z) * normal.x - key.x;
      const reflectY = 2 * (normal.x * key.x + normal.y * key.y + normal.z * key.z) * normal.y - key.y;
      const reflectZ = 2 * (normal.x * key.x + normal.y * key.y + normal.z * key.z) * normal.z - key.z;
      const specDot = Math.max(0, reflectX * viewVec.x + reflectY * viewVec.y + reflectZ * viewVec.z);

      // Simulated operating room dual softbox reflection lines for extreme realism
      const softbox1 = { x: -0.5, y: -0.8, z: -0.3 };
      const s1Len = Math.sqrt(softbox1.x * softbox1.x + softbox1.y * softbox1.y + softbox1.z * softbox1.z);
      const s1Norm = { x: softbox1.x / s1Len, y: softbox1.y / s1Len, z: softbox1.z / s1Len };
      const reflectX1 = 2 * (normal.x * s1Norm.x + normal.y * s1Norm.y + normal.z * s1Norm.z) * normal.x - s1Norm.x;
      const reflectY1 = 2 * (normal.x * s1Norm.x + normal.y * s1Norm.y + normal.z * s1Norm.z) * normal.y - s1Norm.y;
      const reflectZ1 = 2 * (normal.x * s1Norm.x + normal.y * s1Norm.y + normal.z * s1Norm.z) * normal.z - s1Norm.z;
      const specDot1 = Math.max(0, reflectX1 * viewVec.x + reflectY1 * viewVec.y + reflectZ1 * viewVec.z);

      const softbox2 = { x: 0.5, y: -0.8, z: -0.3 };
      const s2Len = Math.sqrt(softbox2.x * softbox2.x + softbox2.y * softbox2.y + softbox2.z * softbox2.z);
      const s2Norm = { x: softbox2.x / s2Len, y: softbox2.y / s2Len, z: softbox2.z / s2Len };
      const reflectX2 = 2 * (normal.x * s2Norm.x + normal.y * s2Norm.y + normal.z * s2Norm.z) * normal.x - s2Norm.x;
      const reflectY2 = 2 * (normal.x * s2Norm.x + normal.y * s2Norm.y + normal.z * s2Norm.z) * normal.y - s2Norm.y;
      const reflectZ2 = 2 * (normal.x * s2Norm.x + normal.y * s2Norm.y + normal.z * s2Norm.z) * normal.z - s2Norm.z;
      const specDot2 = Math.max(0, reflectX2 * viewVec.x + reflectY2 * viewVec.y + reflectZ2 * viewVec.z);

      let shininess = 20;
      let specIntens = 0.45 * wetness; // default enamel glossy sheen modulated by wetness

      if (renderingMode === "realistic") {
        shininess = 38; specIntens = 0.85 * wetness;
      } else if (renderingMode === "opalescent") {
        shininess = 48; specIntens = 1.05 * wetness;
      }

      if (type === "implant") {
        shininess = 34; specIntens = 0.8 * wetness; // Titanium
      } else if (type === "probe") {
        shininess = 28; specIntens = 0.65 * wetness; // Steel
      } else if (type === "blood") {
        shininess = 10; specIntens = 0.95 * wetness; // Liquid
      } else if (type === "gum" || type === "bone") {
        shininess = 4; specIntens = 0.05 * wetness;  // Matte
      }

      let specular = Math.pow(specDot, shininess) * specIntens;

      // Add dual softbox panel highlights for extreme surface glossiness
      if (type === "crown" || type === "implant" || type === "blood") {
        const softboxIntens = renderingMode === "realistic" ? 0.45 * wetness : renderingMode === "opalescent" ? 0.65 * wetness : 0.2 * wetness;
        specular += Math.pow(specDot1, shininess * 1.2) * softboxIntens;
        specular += Math.pow(specDot2, shininess * 1.2) * softboxIntens;
      }

      // Ambient Occlusion shadowing (deep crevices and structural cavities get darker)
      const radialDist = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
      const ao = Math.min(1.0, 0.48 + 0.52 * radialDist);

      // Fresnel edge reflection (stronger reflection at grazing angles)
      const normalZView = Math.abs(normal.z);
      const fresnel = Math.pow(1.0 - normalZView, 4.0) * (renderingMode === "realistic" ? 0.75 : renderingMode === "opalescent" ? 0.95 : 0.3);

      // Micro-texture / Growth lines (Perikymata) on the crown
      let perikymataFactor = 1.0;
      if (renderingMode === "realistic" && type === "crown") {
        perikymataFactor = 0.93 + Math.sin(origY * 3.2) * 0.07;
      }

      // Organic micro-speckle to simulate real enamel crystal prisms
      let prismNoise = 1.0;
      if (renderingMode === "realistic" && type === "crown") {
        const dotNoise = Math.sin(normal.x * 85.0 + normal.y * 110.0 + normal.z * 95.0);
        prismNoise = 0.98 + dotNoise * 0.02;
      }

      // Natural longitudinal root cementum fiber texture
      let rootFiberFactor = 1.0;
      if (renderingMode === "realistic" && type === "root") {
        rootFiberFactor = 0.94 + Math.sin(origY * 1.5 + Math.atan2(normal.x, normal.z) * 6.0) * 0.06;
      }

      if (baseColor.startsWith("rgb")) {
        const matches = baseColor.match(/\d+/g);
        if (matches && matches.length >= 3) {
          const rRaw = parseInt(matches[0]);
          const gRaw = parseInt(matches[1]);
          const bRaw = parseInt(matches[2]);
          const aRaw = matches.length >= 4 ? parseFloat(matches[3]) : 1.0;

          // Compute lit components with perikymata waves and enamel prism noise and root fibers
          let rLit = rRaw * (0.24 + diffKey * 0.76) * ao * perikymataFactor * prismNoise * rootFiberFactor + (sssFactor * 220) + (diffRim * 35) + (specular * 255);
          let gLit = gRaw * (0.24 + diffKey * 0.72 + diffFill * 0.15) * ao * perikymataFactor * prismNoise * rootFiberFactor + (sssFactor * 120) + (diffRim * 15) + (specular * 255);
          let bLit = bRaw * (0.24 + diffKey * 0.62 + diffFill * 0.32) * ao * perikymataFactor * prismNoise * rootFiberFactor + (sssFactor * 60) + (specular * 255);

          // Add Fresnel edge glow (pearl halo on grazing contours)
          if (type === "crown") {
            if (renderingMode === "realistic") {
              rLit += fresnel * 45;
              gLit += fresnel * 40;
              bLit += fresnel * 30;
            } else if (renderingMode === "opalescent") {
              // Iridescent shift: cool cyan/violet margins
              rLit = rLit * (1.0 - fresnel) + 210 * fresnel;
              gLit = gLit * (1.0 - fresnel) + 235 * fresnel;
              bLit = bLit * (1.0 - fresnel) + 255 * fresnel;
            }
          }

          // Subcellular vascular scattering bleed in dark hollow areas
          if (type === "root" || type === "pulp") {
            rLit += (1.0 - ao) * 22;
          }

          const rFinal = Math.min(255, Math.floor(rLit));
          const gFinal = Math.min(255, Math.floor(gLit));
          const bFinal = Math.min(255, Math.floor(bLit));

          return aRaw === 1.0 ? `rgb(${rFinal}, ${gFinal}, ${bFinal})` : `rgba(${rFinal}, ${gFinal}, ${bFinal}, ${aRaw})`;
        }
      }
      return baseColor;
    };

    // Render sorted faces with dynamic shading
    faces.forEach((face) => {
      if (!showInternalAnatomy && (face.type === "pulp" || face.type === "pdl")) {
        return;
      }

      // Project vertices to screen coordinates
      const screenPts = face.indices.map((idx) => {
        const rv = rotatedVertices[idx];
        const depth = rv.z + camDistance;
        const perspective = currentScale / Math.max(1, depth);

        return {
          x: width / 2 + rv.x * perspective,
          y: height / 2 + rv.y * perspective,
        };
      });

      // Assign realistic procedural multitonal material gradients
      let baseColor = face.color;

      if (face.color === "gradient-crown" || face.color === "gradient-crown-cap") {
        // Pearlescent tooth enamel: warm neck, creamy middle body, vitreous bluish incisal tips
        const crownRatio = Math.min(1.0, Math.max(0.0, Math.abs(face.originalY || 0) / Math.abs(crownHeight)));
        let rVal = 250, gVal = 246, bVal = 238;

        if (crownRatio < 0.22) {
          // CEJ neck warm yellow-ivory
          const t = crownRatio / 0.22;
          rVal = 228 + (250 - 228) * t;
          gVal = 208 + (246 - 208) * t;
          bVal = 170 + (238 - 170) * t;
        } else if (crownRatio > 0.82) {
          // Incisal opalescent translucent bluish edge
          const t = (crownRatio - 0.82) / 0.18;
          rVal = 250 - (250 - 204) * t;
          gVal = 246 - (246 - 218) * t;
          bVal = 238 - (238 - 228) * t;
        } else {
          // Cream body
          rVal = 250; gVal = 246; bVal = 238;
        }
        baseColor = `rgb(${Math.floor(rVal)}, ${Math.floor(gVal)}, ${Math.floor(bVal)})`;

      } else if (face.color === "gradient-root") {
        // Natural cementum fiber root: golden yellow-brown transitions towards the apex
        const rootRatio = Math.min(1.0, Math.max(0.0, Math.abs(face.originalY || 0) / Math.abs(rootHeight)));
        const rVal = 234 - (234 - 175) * rootRatio;
        const gVal = 210 - (210 - 138) * rootRatio;
        const bVal = 170 - (170 - 88) * rootRatio;
        baseColor = `rgb(${Math.floor(rVal)}, ${Math.floor(gVal)}, ${Math.floor(bVal)})`;

      } else if (face.type === "gum") {
        // Attached gingiva coral gradients: pink margins to deeper vascular red bases
        const gumRatio = Math.min(1.0, Math.max(0.0, Math.abs(face.originalY || 0) / 22));
        let rVal = 244, gVal = 95, bVal = 125;
        if (isInflamed) {
          // Swollen clinical congestion crimson-violet
          rVal = 180 - (180 - 110) * gumRatio;
          gVal = 22 - (22 - 10) * gumRatio;
          bVal = 64 - (64 - 28) * gumRatio;
        } else {
          // Healthy coral stippled rose
          rVal = 245 - (245 - 228) * gumRatio;
          gVal = 110 - (110 - 115) * gumRatio;
          bVal = 140 - (140 - 142) * gumRatio;
        }
        baseColor = `rgb(${Math.floor(rVal)}, ${Math.floor(gVal)}, ${Math.floor(bVal)})`;
      }

      // Draw Face Canvas Geometry with Gouraud Linear Lighting Gradient!
      ctx.beginPath();
      ctx.moveTo(screenPts[0].x, screenPts[0].y);
      for (let s = 1; s < screenPts.length; s++) {
        ctx.lineTo(screenPts[s].x, screenPts[s].y);
      }

      if (face.isLine) {
        ctx.strokeStyle = face.color;
        ctx.lineWidth = face.lineWidth || 1.5;
        ctx.stroke();
      } else {
        ctx.closePath();

        // Calculate lighting for each vertex of the face
        if (face.indices.length >= 3) {
          const litVertexColors = face.indices.map((idx) => {
            const normal = rotatedVertexNormals[idx];
            const origY = vertices[idx].y;
            return shadeVertex(baseColor, normal, origY, face.type);
          });

          // Compute approximate brightness (luminosity) of each vertex color
          const lums = litVertexColors.map((color) => {
            const matches = color.match(/\d+/g);
            if (matches && matches.length >= 3) {
              return parseInt(matches[0]) * 0.299 + parseInt(matches[1]) * 0.587 + parseInt(matches[2]) * 0.114;
            }
            return 128;
          });

          // Find the brightest and darkest vertices to align the linear shading gradient
          let maxIdx = 0, minIdx = 0;
          for (let s = 1; s < lums.length; s++) {
            if (lums[s] > lums[maxIdx]) maxIdx = s;
            if (lums[s] < lums[minIdx]) minIdx = s;
          }

          if (maxIdx !== minIdx) {
            const pBright = screenPts[maxIdx];
            const pDark = screenPts[minIdx];
            const grad = ctx.createLinearGradient(pBright.x, pBright.y, pDark.x, pDark.y);
            grad.addColorStop(0, litVertexColors[maxIdx]);
            grad.addColorStop(1, litVertexColors[minIdx]);
            ctx.fillStyle = grad;
          } else {
            ctx.fillStyle = litVertexColors[0];
          }
        } else {
          ctx.fillStyle = baseColor;
        }

        ctx.fill();

        // High resolution mesh line smoothing edge separation highlights
        if (face.type === "crown" || face.type === "implant" || face.type === "probe") {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
          ctx.lineWidth = 0.35;
          ctx.stroke();
        }
      }
    });

    // Static studio softbox glaze glare overlay (gives high-end glassy enamel look)
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const reflectionGrad = ctx.createLinearGradient(width / 2 - 28, 0, width / 2 - 12, 0);
    reflectionGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
    reflectionGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.14)"); // Soft pearl glaze reflection
    reflectionGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = reflectionGrad;

    ctx.beginPath();
    ctx.ellipse(width / 2 - 20, height / 2 - 18, 9, 28, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // ----------------- 9. CLINICAL HUD DATA OVERLAYS -----------------
    if (showAnnotations) {
      // Sleek telemetry transparency overlay card
      ctx.fillStyle = "rgba(8, 12, 24, 0.88)";
      ctx.strokeStyle = "rgba(20, 184, 166, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(12, 12, 142, 80, 10);
      ctx.fill();
      ctx.stroke();

      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#2dd4bf"; // Teal clinical head
      ctx.fillText(`FDI DIENTE: ${toothNumber}`, 18, 26);

      ctx.fillStyle = "#94a3b8"; // Slate telemetry labels
      ctx.font = "9px sans-serif";
      ctx.fillText(`Sondaje:     ${pocketVal} mm`, 18, 40);
      ctx.fillText(`Recesión:    ${recessVal} mm`, 18, 52);

      const cal = pocketVal + recessVal;
      ctx.fillStyle = cal >= 5 ? "#f43f5e" : cal >= 3 ? "#f59e0b" : "#10b981";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText(`N.I.C. (CAL): ${cal} mm`, 18, 66);
      
      const bopText = isBleeding ? "Sangrado (+ BOP)" : "Sangrado (-)";
      ctx.fillStyle = isBleeding ? "#f43f5e" : "#64748b";
      ctx.fillText(bopText, 18, 78);

      // Dynamic 3D probe measuring ticks annotations
      const majorTicks = [3, 6, 9, 12, 15];
      majorTicks.forEach((mm) => {
        const yCoord = probeTipY - (mm * scaleFactor * -dir);
        
        const x1 = probeX * cosY - probeZ * sinY;
        const z1 = probeX * sinY + probeZ * cosY;
        const y2 = yCoord * cosX - z1 * sinX;
        const z2 = yCoord * sinX + z1 * cosX;

        const depth = z2 + camDistance;
        const perspective = currentScale / Math.max(1, depth);
        const screenX = width / 2 + x1 * perspective;
        const screenY = height / 2 + y2 * perspective;

        ctx.font = "bold 8px monospace";
        ctx.fillStyle = mm % 6 === 0 ? "#2dd4bf" : "#64748b";
        ctx.fillText(`-${mm}`, screenX + (probeX >= 0 ? 6 : -16), screenY + 2);
      });

      // Directional axes inside HUD margins
      const ax = width - 20;
      const ay = height - 20;
      const axLen = 8;

      const rxX = axLen * cosY;
      const rxY = axLen * sinY * sinX;
      const ryX = 0;
      const ryY = -axLen * cosX;
      const rzX = -axLen * sinY;
      const rzY = axLen * cosY * sinX;

      ctx.lineWidth = 1.0;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + rxX, ay + rxY); ctx.strokeStyle = "#f43f5e"; ctx.stroke(); // X - Red
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + ryX, ay + ryY); ctx.strokeStyle = "#10b981"; ctx.stroke(); // Y - Green
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + rzX, ay + rzY); ctx.strokeStyle = "#3b82f6"; ctx.stroke(); // Z - Blue
    }
  }, [
    toothNumber,
    activeArch,
    showInternalAnatomy,
    pocketData,
    recessData,
    bleedingData,
    plaqueData,
    condition,
    inputPosition,
    inputSurface,
    yaw,
    pitch,
    zoom,
    showAnnotations,
    renderingMode,
    rotationSpeed,
    lightAngle,
    wetness,
    isFullscreen,
  ]);

  return (
    <div 
      className={
        isFullscreen 
          ? "fixed inset-0 z-[9999] bg-[#020408]/98 backdrop-blur-xl flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-8 overflow-y-auto animate-fade-in" 
          : "flex flex-col items-center gap-3 w-full"
      } 
      id="tooth-3d-interactive-system"
    >
      {/* Fullscreen Close button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-[10000] p-2.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 hover:text-rose-100 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 font-bold text-xs shadow-lg shadow-rose-950/40"
          title="Cerrar Pantalla Completa"
        >
          <Minimize2 className="w-4 h-4" />
          <span>Cerrar</span>
        </button>
      )}

      <div className={
        isFullscreen 
          ? "relative w-full aspect-[1/1.1] max-w-[500px] md:max-w-[580px] bg-[#020408] rounded-3xl border border-slate-800 shadow-2xl overflow-hidden group flex-shrink-0 transition-all duration-300" 
          : "relative w-full aspect-[1/1.1] max-w-[240px] bg-[#020408] rounded-2xl border border-slate-800 shadow-xl overflow-hidden group transition-all duration-300"
      }>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className={`w-full h-full cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
        />

        {/* Floating annotations and mode triggers */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowAnnotations(!showAnnotations)}
            className="p-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-md text-[9px] cursor-pointer transition-all"
            title={showAnnotations ? "Ocultar Datos HUD" : "Mostrar Datos HUD"}
          >
            {showAnnotations ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <div className="bg-teal-500/10 text-teal-400 border border-teal-500/30 px-2 py-0.5 rounded-md text-[8px] font-bold tracking-wider font-mono flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-teal-400 animate-pulse" />
            3D REALISTA
          </div>
        </div>

        {/* Lower control deck */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center bg-slate-950/90 backdrop-blur-md border border-slate-800/80 px-2.5 py-1.5 rounded-xl">
          <span className="text-[9px] font-medium text-slate-400 flex items-center gap-1">
            <Activity className="w-3 h-3 text-teal-400 animate-pulse" />
            {isFullscreen ? "Arrastra / Zoom" : "Girar"}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.1))}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Alejar"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <button
              onClick={() => setZoom((prev) => Math.min(1.8, prev + 0.1))}
              className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
              title="Acercar"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1 rounded-lg cursor-pointer border transition-all ${
                autoRotate
                  ? "bg-teal-500/15 text-teal-400 border-teal-500/30"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title={autoRotate ? "Pausar Rotación" : "Giro Automático"}
            >
              {autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
            <button
              onClick={() => {
                setYaw(0.4);
                setPitch(0.15);
                setZoom(1.15);
                setAutoRotate(false);
              }}
              className="p-1 rounded-lg cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Restaurar Cámara"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1 rounded-lg cursor-pointer border transition-all ${
                isFullscreen
                  ? "bg-teal-500/15 text-teal-400 border-teal-500/30"
                  : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white"
              }`}
              title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

      {/* Realism and Speed HUD Control center below the 3D viewer */}
      <div className={
        isFullscreen 
          ? "w-full max-w-[340px] flex flex-col gap-3 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-[11px] backdrop-blur-md shadow-2xl flex-shrink-0 transition-all duration-300" 
          : "w-full max-w-[240px] flex flex-col gap-2 mt-1 bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-[10px] backdrop-blur-sm shadow-2xl transition-all duration-300"
      }>
        {/* Render mode selector */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Estilo de Renderizado</span>
          <div className="grid grid-cols-3 gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/50">
            <button
              onClick={() => setRenderingMode("realistic")}
              className={`py-1 text-[9px] font-medium rounded-md transition-all cursor-pointer ${
                renderingMode === "realistic"
                  ? "bg-teal-500/15 text-teal-300 border border-teal-500/30 font-bold"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              Fotorrealista
            </button>
            <button
              onClick={() => setRenderingMode("opalescent")}
              className={`py-1 text-[9px] font-medium rounded-md transition-all cursor-pointer ${
                renderingMode === "opalescent"
                  ? "bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              Ópalo
            </button>
            <button
              onClick={() => setRenderingMode("clinical")}
              className={`py-1 text-[9px] font-medium rounded-md transition-all cursor-pointer ${
                renderingMode === "clinical"
                  ? "bg-slate-800 text-slate-200 border border-slate-700 font-bold"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              Clínico
            </button>
          </div>
        </div>

        {/* Dynamic Light Positioner / Gabinete */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            <span>Iluminación de Gabinete</span>
            <span className="text-amber-400 font-mono text-[8px] font-normal">
              {autoRotateLight ? "● Giratoria" : "Fija"}
            </span>
          </span>
          <div className="grid grid-cols-2 gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/50">
            <button
              onClick={() => setAutoRotateLight(true)}
              className={`py-1 text-[9px] font-medium rounded-md transition-all cursor-pointer ${
                autoRotateLight
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              Luz Dinámica
            </button>
            <button
              onClick={() => {
                setAutoRotateLight(false);
                setLightAngle(0.0); // Reset angle
              }}
              className={`py-1 text-[9px] font-medium rounded-md transition-all cursor-pointer ${
                !autoRotateLight
                  ? "bg-slate-800 text-slate-200 border border-slate-700"
                  : "text-slate-400 hover:text-white border border-transparent"
              }`}
            >
              Fijar Luz
            </button>
          </div>
        </div>

        {/* Enamel wetness / specular slider */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            <span>Humedad / Brillo Esmalte</span>
            <span className="text-sky-400 font-mono text-[8px] font-normal">
              {wetness <= 0.35 ? "Seco (Mate)" : wetness <= 0.7 ? "Satinado" : "Húmedo (Gloss)"}
            </span>
          </span>
          <div className="grid grid-cols-3 gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/50">
            {[
              { label: "Mate", val: 0.2 },
              { label: "Satinado", val: 0.6 },
              { label: "Espejo", val: 1.15 }
            ].map((wt) => (
              <button
                key={wt.label}
                onClick={() => setWetness(wt.val)}
                className={`py-1 text-[9px] font-medium rounded-md transition-all cursor-pointer ${
                  wetness === wt.val
                    ? "bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold"
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {wt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rotation Speed selector */}
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
            <span>Turbina de Giro</span>
            <span className="text-teal-400 font-mono text-[8px] font-normal">
              {rotationSpeed === 0.008 ? "1x Lento" : rotationSpeed === 0.035 ? "3x Normal" : rotationSpeed === 0.08 ? "6x Rápido" : rotationSpeed === 0.16 ? "10x Turbo" : "20x Híper"}
            </span>
          </span>
          <div className="grid grid-cols-5 gap-1 bg-slate-900/60 p-0.5 rounded-lg border border-slate-800/50">
            {[
              { label: "1x", val: 0.008 },
              { label: "3x", val: 0.035 },
              { label: "6x", val: 0.08 },
              { label: "10x", val: 0.16 },
              { label: "20x", val: 0.32 }
            ].map((sp) => (
              <button
                key={sp.label}
                onClick={() => {
                  setRotationSpeed(sp.val);
                  setAutoRotate(true);
                }}
                className={`py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${
                  rotationSpeed === sp.val
                    ? "bg-teal-500/15 text-teal-300 border border-teal-500/30"
                    : "text-slate-400 hover:text-white border border-transparent"
                }`}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
