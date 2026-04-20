const getActionSize = (
  size?: string | null,
): "xs" | "sm" | "default" | "lg" => {
  switch (size) {
    case "xs":
      return "xs";
    case "sm":
      return "sm";
    case "lg":
    case "xl":
      return "lg";
    default:
      return "default";
  }
};

const getActionVariant = (actionType: string) => {
  switch (actionType) {
    case "default":
      return "default";
    case "primary":
      return "default";
    case "secondary":
      return "secondary";
    case "tertiary":
      return "tertiary";
    case "ghost":
      return "ghost";
    case "destructive":
      return "destructive";
    default:
      return "default";
  }
};

export { getActionSize, getActionVariant };
