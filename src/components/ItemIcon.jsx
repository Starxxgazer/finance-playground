import { asset } from "./Ui.jsx";

export default function ItemIcon({ id, small = false }) {
  return (
    <img
      className={`item-art ${small ? "item-art-small" : ""}`}
      src={asset(`items/${id}.webp`)}
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  );
}
