import { useEffect } from "react";
import { useLocation } from "wouter";

interface NavigateProps {
  replace?: boolean;
  to: string;
}

export function Navigate(props: NavigateProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate(props.to, { replace: props.replace ?? true });
  }, [navigate, props.replace, props.to]);

  return null;
}
