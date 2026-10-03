import { useEffect, useRef, useId } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpenText,
  CalendarBlank,
  ChartLine,
  ChatCircleText,
  Check,
  CheckCircle,
  ClipboardText,
  FileText,
  Lightbulb,
  LockSimple,
  MagnifyingGlass,
  Notebook,
  Pause,
  Play,
  Receipt,
  SealCheck,
  Wallet,
  X,
  ArrowCounterClockwise,
  CaretRight,
  MapPin,
  FilmSlate,
  Link as LinkIcon,
  GearSix,
  CornersOut,
  BagSimple,
  Calculator,
  CalendarCheck,
  CashRegister,
  Clipboard,
  Signature,
  FolderOpen,
  PhoneCall,
  ArrowsLeftRight,
  Coins,
  Path,
  Key,
  PaintRoller,
  Oven,
  UsersThree,
  Stack,
  Storefront,
  ChartBar,
  AddressBook,
  UserList,
  UserCircle,
  ChatsCircle,
  ListChecks,
  WarningCircle,
  Bread,
  Timer,
} from "@phosphor-icons/react";

const icons = {
  bag: BagSimple,
  calculator: Calculator,
  calendarCheck: CalendarCheck,
  cashRegister: CashRegister,
  clipboardBlank: Clipboard,
  signature: Signature,
  folder: FolderOpen,
  phone: PhoneCall,
  transfer: ArrowsLeftRight,
  coins: Coins,
  trace: Path,
  key: Key,
  paint: PaintRoller,
  oven: Oven,
  people: UsersThree,
  stack: Stack,
  shop: Storefront,
  forecast: ChartBar,
  addressBook: AddressBook,
  survey: UserList,
  person: UserCircle,
  conversation: ChatsCircle,
  proof: ListChecks,
  risk: WarningCircle,
  bread: Bread,
  timer: Timer,
  settings: GearSix,
  fullscreen: CornersOut,
  arrow: ArrowRight,
  back: ArrowLeft,
  book: BookOpenText,
  calendar: CalendarBlank,
  chart: ChartLine,
  chat: ChatCircleText,
  check: Check,
  done: CheckCircle,
  clipboard: ClipboardText,
  file: FileText,
  hint: Lightbulb,
  lock: LockSimple,
  search: MagnifyingGlass,
  notebook: Notebook,
  pause: Pause,
  play: Play,
  receipt: Receipt,
  wallet: Wallet,
  close: X,
  seal: SealCheck,
  reset: ArrowCounterClockwise,
  caret: CaretRight,
  pin: MapPin,
  film: FilmSlate,
  link: LinkIcon,
};
export function Icon({ name, size = 20, ...props }) {
  const Component = icons[name] || FileText;
  return (
    <Component size={size} weight="regular" aria-hidden="true" {...props} />
  );
}
export function Button({
  children,
  secondary = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`${secondary ? "button-secondary" : "button-primary"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export const asset = (path) =>
  `${window.__GAME_ASSET_BASE__ ?? import.meta.env.BASE_URL}${path}`;
export const characters = {
  chen: {
    name: "陈叔",
    role: "留灯烘焙负责人",
    portraitSize: "580% auto",
    portraitPosition: "16% 3%",
  },
  lin: {
    name: "林姐",
    role: "你的带教同事，负责复核",
    portraitSize: "700% auto",
    portraitPosition: "19% 4%",
  },
  meng: {
    name: "老孟",
    role: "老店设备供应商",
    portraitSize: "580% auto",
    portraitPosition: "16% 1%",
  },
  xiaohe: {
    name: "小禾",
    role: "面包店店员，你的朋友",
    portraitSize: "700% auto",
    portraitPosition: "17% 0.5%",
  },
};
export function Portrait({ person, large = false }) {
  return (
    <div
      role="img"
      aria-label={characters[person].name}
      className={`portrait portrait-${person} ${large ? "portrait-large" : ""}`}
      style={{
        backgroundImage: `url("${asset(`characters/${person}.webp`)}")`,
        // Frame the front view from the supplied character sheet without altering it.
        backgroundSize: characters[person].portraitSize,
        backgroundPosition: characters[person].portraitPosition,
      }}
    />
  );
}
export function Dialogue({ person, children }) {
  return (
    <div className="dialogue">
      <Portrait person={person} />
      <div>
        <strong>{characters[person].name}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide = false,
  className = "",
  closeLabel = "关闭窗口",
}) {
  const ref = useRef(null);
  const id = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    dialog.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`modal ${wide ? "modal-wide" : ""} ${className}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-heading">
        <h2 id={id}>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <Icon name={closeLabel === "返回全景" ? "back" : "close"} />
          {closeLabel === "返回全景" && <span>返回全景</span>}
        </button>
      </div>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
