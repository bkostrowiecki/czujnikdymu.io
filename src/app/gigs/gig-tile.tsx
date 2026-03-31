import { Badge, Card, CardBody, CardImg, CardSubtitle, CardText, CardTitle, Row } from "react-bootstrap";

export function GigTile() {
  return (
    <Card className="shadow-lg">
      <CardImg
        src={
          "https://scontent.fpoz5-1.fna.fbcdn.net/v/t39.30808-6/621577392_122178688196437713_6365770576971156129_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=7e0d18&_nc_ohc=Yh6FcDq6jKQQ7kNvwE8F0c-&_nc_oc=Adk0zSZtUI_L7RfAf9hlF05_2wZOvWDY6xkNkHexneIRgWy33JdukTYDqkvPUi2UL6k&_nc_zt=23&_nc_ht=scontent.fpoz5-1.fna&_nc_gid=8IUdfEQm7wDb5YozyZVUDQ&oh=00_AfsYy6s9jB1hl2_Kmz0LQAnUbtOU9LhSLtEaGEeOM21E1w&oe=69A3FC3E"
        }
      ></CardImg>

      <CardBody>
        <CardTitle>Test</CardTitle>
        <CardSubtitle>28.02.2026, Klub Mechanik</CardSubtitle>
        <CardText className="mt-2">
          <div className="d-flex flex-wrap gap-1 max-w-100">
          <Badge>Rapcore</Badge>
          <Badge>Nu metal</Badge>
          </div>
        </CardText>
      </CardBody>
    </Card>
  );
}
