import { Badge, Card, CardBody, CardImg, CardSubtitle, CardText, CardTitle, Row } from "react-bootstrap";

export function ArtistTile() {
  return (
    <Card className="shadow-lg">
      <CardImg
        src={
          "https://scontent.fpoz5-1.fna.fbcdn.net/v/t39.30808-6/434254110_978931570254833_4377318839728988009_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=1d70fc&_nc_ohc=No9L8pn_UuQQ7kNvwFSgGYP&_nc_oc=AdnQeyoWVnGBIgoWagoDV9XAE6cu0e3VkGDUWivcy8WqIfv-RI9Jb8WIhGRm3iew2kc&_nc_zt=23&_nc_ht=scontent.fpoz5-1.fna&_nc_gid=rvTzFWyqWggPfQL_zhGtfw&oh=00_AfssI2RHQtbzR4eGVnDEsz-jvVu213OpGKYA-T5jlomOaQ&oe=69A42A2D"
        }
      ></CardImg>

      <CardBody>
        <CardTitle>Fu Manchu</CardTitle>
        <CardText className="mt-2">
          <div className="d-flex flex-wrap gap-1 max-w-100">
          <Badge>Stoner</Badge>
          </div>
        </CardText>
      </CardBody>
    </Card>
  );
}
