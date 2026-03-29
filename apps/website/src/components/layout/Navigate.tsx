import { useEffect } from "react";
import { useLocation } from "wouter";

interface NavigateProps {
  to: string;
}

export function Navigate(props: NavigateProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate(props.to);
  }, [navigate, props.to]);

  return null;
}
