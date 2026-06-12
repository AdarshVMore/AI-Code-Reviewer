import { useState } from "react";
import { X } from "lucide-react";
import { TypingText } from "../ui/TypingText";
import Link from "next/link";

type TakeActionContent = {
  message: string;
  buttonLable: string;
  urlOnButton: string;
};

export function TakeAction({
  message,
  buttonLable,
  urlOnButton,
}: TakeActionContent) {
  const [showButton, setShowButton] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-black p-4 pb-0">
      <div className="flex items-center justify-between font-mono bg-[#917B00] rounded-sm border-b p-2 h-10 pr-4">
        <div className="flex gap-2 align-middle margin-auto items-center">
          <p className="text-white text-[12px] pl-2">
            <TypingText
              text={message}
              speed={105}
              onComplete={() => setShowButton(true)}
            />
          </p>

          {showButton && (
            <Link href={urlOnButton}>
              <button
                className="rounded-sm text-[12px] flex items-center justify-center text-white border px-2 h-[24px] animate-in fade-in duration-300"
              >
                {buttonLable}
              </button>
            </Link>
          )}
        </div>
        <button
          aria-label="Close"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          type="button"
          onClick={() => setIsDismissed(true)}
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
