import {DataTypes, Model} from 'sequelize'
import {sequelizeConnection} from './connection'

interface NodeAttributes {
    id: string;
    name: string;
    value: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class Node extends Model implements NodeAttributes {
    public id!: string;
    public name!: string;
    public value!: string;

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

Node.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    value: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    tableName: 'node',
    paranoid: true,
    timestamps: true,
    sequelize: sequelizeConnection
})
