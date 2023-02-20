import { Db } from "mongodb";
import { objectIndex } from "../../../app/shared/data_utils/objectIndex";
import { ConnectionWithEntityInfoType } from "./hubs";

const anyTemplateString = '*';
type anyTemplateStringType = '*';
type templateInputType = anyTemplateStringType | string[];

enum ConnectionDirections {
    in = 'in',
    out = 'out',
}

let TEMPLATE_IDS_BY_NAME: Record<string, string> = {};
let TEMPLATE_NAMES_BY_ID: Record<string, string> = {};
let RELATIONTYPE_IDS_BY_NAME: Record<string, string> = {};
let RELATIONTYPE_NAMES_BY_ID: Record<string, string> = {};

const readTypes = async (db: Db) => {
    TEMPLATE_IDS_BY_NAME = objectIndex(
        await db.collection('templates').find().toArray(),
        t => t.name,
        t => t._id.toHexString()
    );
    RELATIONTYPE_IDS_BY_NAME = objectIndex(
        await db.collection('relationtypes').find().toArray(),
        r => r.name,
        r => r._id.toHexString()
    );
    RELATIONTYPE_NAMES_BY_ID = Object.fromEntries(Object.entries(RELATIONTYPE_IDS_BY_NAME).map(([name, id]) => [id, name]));
    TEMPLATE_NAMES_BY_ID = Object.fromEntries(Object.entries(TEMPLATE_IDS_BY_NAME).map(([name, id]) => [id, name]));
};

class UnknownTypeOrTemplateError extends Error {};

class ConnectionInfo {
    from: templateInputType;
    through: templateInputType;
    to: templateInputType;
    constructor(from: templateInputType, through: templateInputType, direction: string, to: templateInputType) {
        this.from = from;
        this.through = through;
        this.to = to;
        if(direction == ConnectionDirections.in){
            const temp = this.from;
            this.from = this.to;
            this.to = temp;
        }
    }

    get hashableString(){
        return `from: ${JSON.stringify(this.from)} - through: ${JSON.stringify(this.through)} - to: ${JSON.stringify(this.to)}`;
    }

    getCopyWithIds(){
        return new ConnectionInfo(
            this.from === anyTemplateString ? this.from : this.from.map(name => TEMPLATE_IDS_BY_NAME[name]),
            this.through === anyTemplateString ? this.through : this.through.map(name => RELATIONTYPE_IDS_BY_NAME[name]),
            ConnectionDirections.out,
            this.to === anyTemplateString ? this.to : this.to.map(name => TEMPLATE_IDS_BY_NAME[name])
        )
    }

    getCopyWithNames(){
        return new ConnectionInfo(
            this.from === anyTemplateString ? this.from : this.from.map(name => TEMPLATE_NAMES_BY_ID[name]),
            this.through === anyTemplateString ? this.through : this.through.map(name => RELATIONTYPE_NAMES_BY_ID[name]),
            ConnectionDirections.out,
            this.to === anyTemplateString ? this.to : this.to.map(name => TEMPLATE_NAMES_BY_ID[name])
        )
    }

    nullCheck() {
        const checkArray = (checkable: templateInputType) => {
            if (checkable !== anyTemplateString && checkable.filter(c => !c).length) {
                throw new UnknownTypeOrTemplateError(
                    `There is a null/undefined type or template in a connection:\n${JSON.stringify(this)}\n${JSON.stringify(this)}`
                    )
            }
        };
        checkArray(this.from);
        checkArray(this.through);
        checkArray(this.to);
    }

    emptyCheck() {
        if(
            this.from.length === 0 ||
            this.through.length === 0 ||
            this.to.length === 0
        ){
            throw new Error(`There is an empty array in in connection ${JSON.stringify(this)}`);
        }
    };
}

class ConnectionDescriptor {
    named: ConnectionInfo;
    withIds: ConnectionInfo;

    constructor(from: templateInputType, through: templateInputType, direction: string, to: templateInputType, given_ids: boolean = false) {
        try{
            if(given_ids) {
                this.withIds = new ConnectionInfo(from, through, direction, to);
                this.named = this.withIds.getCopyWithNames();
            } else {
                this.named = new ConnectionInfo(from, through, direction, to);
                this.withIds = this.named.getCopyWithIds();
            }
            this.named.nullCheck();
            this.withIds.nullCheck();
        } catch (err) {
            if (err instanceof UnknownTypeOrTemplateError) {
                throw new UnknownTypeOrTemplateError(
                    `There is a null/undefined type or template in a connection:\n${JSON.stringify(this.named)}\n${JSON.stringify(this.withIds)}`
                    )
            }
            throw err;
        }
    }

    get hashableString(){
        return this.withIds.hashableString;
    }

    get readableString(){
        return this.named.hashableString;
    }
}

const getEntityTemplateName = (id: string) => TEMPLATE_NAMES_BY_ID[id];
const getRelationTypeTemplateName = (id: string) => RELATIONTYPE_NAMES_BY_ID[id];

const makeRawConnectionReadable = (connection: ConnectionWithEntityInfoType) => ({
    ...connection,
    entityTemplate: getEntityTemplateName(connection.entityTemplateId.toString()),
    templateName: getRelationTypeTemplateName(connection.template.toString())
});

const makeRawConnectionsReadable = (connections: ConnectionWithEntityInfoType[]) =>
    connections.map(connection => makeRawConnectionReadable(connection));

export { anyTemplateString, ConnectionDescriptor, getEntityTemplateName, getRelationTypeTemplateName, makeRawConnectionsReadable, readTypes };