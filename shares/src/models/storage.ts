import {DataTypes, Model} from 'sequelize'
import {sequelizeConnection} from './connection'


interface StorageValueAttribute {
    node: string;
    index: string;
}

interface StorageAttributes {
    id: string;
    value: StorageValueAttribute[];
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export class Storage extends Model implements StorageAttributes {
    public id!: string;
    public value!: StorageValueAttribute[];

    // timestamps!
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
    public readonly deletedAt!: Date;
}

Storage.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    value: {
        type: DataTypes.JSONB,
        allowNull: false
    },
}, {
    tableName: 'storage',
    paranoid: true,
    timestamps: true,
    sequelize: sequelizeConnection
})
