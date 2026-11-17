"use client";

import React from "react";
import { motion, type Variants } from "framer-motion";
import { TITLE_LETTERS } from "../../lib/titleLetters";

const containerVariants: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.065,
      delayChildren: 0.1,
    },
  },
};

const letterVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.36,
      ease: [0.34, 1.35, 0.64, 1],
    },
  },
};

interface AnimatedCoupleNameProps {
  bride: string;
  groom: string;
  className?: string;
  brideSize?: string;
  ampSize?: string;
  groomSize?: string;
  line2NegativeMargin?: string;
  isCover?: boolean;
}

export function AnimatedCoupleName({
  bride,
  groom,
  className = "text-[#6C1420] w-full px-2 sm:px-4 my-1 select-none",
  brideSize = "text-[94px] sm:text-[108px]",
  ampSize = "text-[62px] sm:text-[72px]",
  groomSize = "text-[94px] sm:text-[108px]",
  line2NegativeMargin = "-mt-3.5 sm:-mt-5",
  isCover = false,
}: AnimatedCoupleNameProps) {
  const brideChars = bride.split("");
  const groomChars = groom.split("");

  return (
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      {...(isCover
        ? { animate: "visible" }
        : { whileInView: "visible", viewport: { once: false, amount: 0.15 } }
      )}
      className={className}
    >
      <div className="flex items-baseline justify-start pl-2 sm:pl-4 leading-[0.72] whitespace-nowrap">
        {brideChars.map((char, i) => (
          <motion.span
            key={`b-${i}`}
            variants={letterVariants}
            className={`font-brawford font-normal ${brideSize} tracking-tight inline-block`}
            style={{ transformOrigin: "center center" }}
          >
            {char}
          </motion.span>
        ))}
        <span className="inline-block w-2 sm:w-3"></span>
        <motion.span
          variants={letterVariants}
          className={`font-brawford font-normal ${ampSize} ml-1 sm:ml-2 inline-block`}
          style={{ transformOrigin: "center center" }}
        >
          &amp;
        </motion.span>
      </div>
      <div className={`flex justify-end pr-2 sm:pr-4 leading-[0.72] whitespace-nowrap ${line2NegativeMargin}`}>
        {groomChars.map((char, i) => (
          <motion.span
            key={`g-${i}`}
            variants={letterVariants}
            className={`font-brawford font-normal ${groomSize} tracking-tight inline-block`}
            style={{ transformOrigin: "center center" }}
          >
            {char}
          </motion.span>
        ))}
      </div>
    </motion.h1>
  );
}

interface AnimatedTitleProps {
  type: keyof typeof TITLE_LETTERS;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export function AnimatedTitle({
  type,
  alt,
  className = "w-56 sm:w-64",
  fallbackSrc,
}: AnimatedTitleProps) {
  const data = TITLE_LETTERS[type];
  if (!data) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={`${className} h-auto object-contain select-none pointer-events-none drop-shadow-sm`}
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.15 }}
      className={`relative select-none pointer-events-none drop-shadow-sm ${className}`}
      style={{
        aspectRatio: `${data.width} / ${data.height}`,
      }}
      aria-label={alt}
      role="img"
    >
      {data.letters.map((letter, idx) => (
        <motion.img
          key={idx}
          src={letter.src}
          alt=""
          variants={letterVariants}
          className="absolute select-none pointer-events-none"
          style={{
            left: `${letter.left}%`,
            top: `${letter.top}%`,
            width: `${letter.width}%`,
            height: `${letter.height}%`,
            transformOrigin: "center center",
          }}
        />
      ))}
    </motion.div>
  );
}
