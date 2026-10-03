import { itemAppearance } from "../game/inventory.js";
import { Icon } from "./Ui.jsx";

export default function ItemIcon({ id, small = false }) {
  const look = itemAppearance(id);
  return (
    <span
      className={`item-art item-${look.shape} ${small ? "item-art-small" : ""}`}
      aria-hidden="true"
    >
      <Icon name={look.icon} size={small ? 22 : 36} weight="duotone" />
      {!small && <span className="item-art-caption">{look.label}</span>}
    </span>
  );
}
