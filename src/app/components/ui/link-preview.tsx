"use client";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { encode } from "qss";
import React from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { cn } from "./utils";

type LinkPreviewProps = {
  children: React.ReactNode;
  url: string;
  className?: string;
  width?: number;
  height?: number;
  previewContent?: React.ReactNode;
} & (
  | { isStatic: true; imageSrc: string }
  | { isStatic?: false; imageSrc?: never }
) & Omit<React.ComponentPropsWithoutRef<"a">, "href">;

export const LinkPreview = ({
  children,
  url,
  className,
  width = 200,
  height = 125,
  isStatic = false,
  imageSrc = "",
  previewContent,
  ...props
}: LinkPreviewProps) => {
  const isLocal = url.startsWith("#");
  const isMailto = url.startsWith("mailto:");
  const isSpecial = isLocal || isMailto;

  const src = React.useMemo(() => {
    if (isStatic) {
      return imageSrc;
    }
    if (isSpecial) {
      return "";
    }

    const params = encode({
      url,
      screenshot: true,
      meta: false,
      embed: "screenshot.url",
      colorScheme: "dark",
      "viewport.isMobile": true,
      "viewport.deviceScaleFactor": 1,
      "viewport.width": width * 3,
      "viewport.height": height * 3,
    });

    return `https://api.microlink.io/?${params}`;
  }, [height, imageSrc, isStatic, url, width, isSpecial]);

  const [isOpen, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (src) {
      const img = new window.Image();
      img.src = src;
    }
  }, [src]);

  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);

  const translateX = useSpring(x, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const targetRect = event.currentTarget.getBoundingClientRect();
    const eventOffsetX = event.clientX - targetRect.left;
    const offsetFromCenter = (eventOffsetX - targetRect.width / 2) / 2;
    x.set(offsetFromCenter);
  };

  return (
    <HoverCardPrimitive.Root
      openDelay={50}
      closeDelay={100}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <HoverCardPrimitive.Trigger asChild>
        <a
          href={url}
          target={isSpecial ? undefined : "_blank"}
          rel={isSpecial ? undefined : "noopener noreferrer"}
          onMouseMove={handleMouseMove}
          className={cn("text-black dark:text-white", className)}
          {...props}
        >
          {children}
        </a>
      </HoverCardPrimitive.Trigger>

      <HoverCardPrimitive.Content
        className="[transform-origin:var(--radix-hover-card-content-transform-origin)] z-50"
        side="top"
        align="center"
        sideOffset={10}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.6 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                },
              }}
              exit={{ opacity: 0, y: 20, scale: 0.6 }}
              className="shadow-xl rounded-xl"
              style={{
                x: translateX,
              }}
            >
              {previewContent ? (
                <a
                  href={url}
                  target={isSpecial ? undefined : "_blank"}
                  rel={isSpecial ? undefined : "noopener noreferrer"}
                  className="block p-4 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl text-left max-w-[280px]"
                >
                  {previewContent}
                </a>
              ) : isSpecial ? (
                <div className="block p-3 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-neutral-800 shadow-xl rounded-xl text-left max-w-[280px]">
                  <p className="text-[12px] opacity-75">
                    Navigate to {url}
                  </p>
                </div>
              ) : (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-1 bg-white border-2 border-transparent shadow rounded-xl hover:border-neutral-200 dark:hover:border-neutral-800"
                  style={{ fontSize: 0 }}
                >
                  <img
                    src={src}
                    width={width}
                    height={height}
                    className="rounded-lg"
                    alt="preview image"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </HoverCardPrimitive.Content>
    </HoverCardPrimitive.Root>
  );
};

