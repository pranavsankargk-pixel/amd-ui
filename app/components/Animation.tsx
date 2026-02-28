"use client";
import { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface AnimationProps {
  file: string; // name of the json file in /animations/ directory
  loop?: boolean;
  style?: React.CSSProperties;
}

export default function Animation({ file, loop = true, style }: AnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch(`/animations/${file}`)
      .then((r) => r.json())
      .then(setAnimationData)
      .catch((e) => console.error("failed to load animation", e));
  }, [file]);

  if (!animationData) return null;
  return <Lottie animationData={animationData} loop={loop} style={style} />;
}
