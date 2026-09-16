"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Nodes = {
  ctx: AudioContext;
  master: GainNode;
  stop: () => void;
};

/**
 * A synthesised drone rather than a shipped audio file: two detuned saws and a
 * sub, through a slow filter sweep. Off by default, as it should be.
 */
function createDrone(): Nodes {
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new Ctor();

  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 320;
  filter.Q.value = 3;
  filter.connect(master);

  const voices: OscillatorNode[] = [];
  const make = (freq: number, type: OscillatorType, gain: number, detune = 0) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    const g = ctx.createGain();
    g.gain.value = gain;
    osc.connect(g).connect(filter);
    osc.start();
    voices.push(osc);
  };

  make(55, "sine", 0.5);
  make(82.4, "sawtooth", 0.12, -7);
  make(82.4, "sawtooth", 0.12, 9);
  make(123.47, "triangle", 0.07);

  // Slow filter breathing, ~28s cycle.
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 1 / 28;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 180;
  lfo.connect(lfoGain).connect(filter.frequency);
  lfo.start();
  voices.push(lfo);

  return {
    ctx,
    master,
    stop: () => {
      voices.forEach((v) => {
        try {
          v.stop();
        } catch {
          /* already stopped */
        }
      });
      void ctx.close();
    },
  };
}

export function AmbientAudio() {
  const nodes = useRef<Nodes | null>(null);
  const [on, setOn] = useState(false);

  useEffect(
    () => () => {
      nodes.current?.stop();
      nodes.current = null;
    },
    [],
  );

  const toggle = useCallback(() => {
    if (!on) {
      if (!nodes.current) nodes.current = createDrone();
      const { ctx, master } = nodes.current;
      void ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.085, ctx.currentTime + 2.4);
      setOn(true);
      return;
    }

    const current = nodes.current;
    if (current) {
      const { ctx, master } = current;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.9);
    }
    setOn(false);
  }, [on]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      // Matches the visible text exactly: an accessible name that does not
      // contain the visible label fails WCAG 2.5.3.
      aria-label={on ? "Sound on" : "Sound off"}
      className="fixed bottom-12 right-6 z-50 flex items-center gap-3 border border-cold-500/40 bg-ink-deep/70 px-3 py-2.5 backdrop-blur-sm transition-colors duration-500 hover:border-amber/60 sm:px-4 md:right-12"
    >
      <span className="flex h-3 items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-[2px] bg-amber transition-all duration-500"
            style={{
              height: on ? `${[7, 12, 5][i]}px` : "2px",
              opacity: on ? 1 : 0.45,
              animation: on
                ? `audio-bar 1.${4 + i}s ease-in-out ${i * 0.16}s infinite`
                : undefined,
            }}
          />
        ))}
      </span>
      {/* Label is dropped on narrow screens, where it lands on the copy. */}
      <span className="label hidden text-[10px] text-cold-300 sm:inline">
        {on ? "Sound on" : "Sound off"}
      </span>
      <style>{`
        @keyframes audio-bar {
          0%, 100% { transform: scaleY(0.45); }
          50% { transform: scaleY(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes audio-bar { 0%, 100% { transform: none; } }
        }
      `}</style>
    </button>
  );
}
