import { Button } from "react-bootstrap";

export const SocialMediaLinks = () => {
  return (
    <>
      <Button variant="link" href="https://fb.com" target="_blank">
        <i className="bi bi-facebook fs-3"></i>
      </Button>
      <Button variant="link" href="https://discord.com" target="_blank">
        <i className="bi bi-discord fs-3"></i>
      </Button>
      <Button variant="link" href="https://instagram.com" target="_blank">
        <i className="bi bi-instagram fs-3"></i>
      </Button>
      <Button variant="link" href="https://tiktok.com" target="_blank">
        <i className="bi bi-tiktok fs-3"></i>
      </Button>
    </>
  );
};
