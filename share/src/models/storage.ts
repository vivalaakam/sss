import { DataTypes, Model } from "sequelize";
import { sequelizeConnection } from "./connection";

interface StorageAttributes {
  id: string;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export class Storage extends Model implements StorageAttributes {
  public id!: string;
  public value!: string;

  // timestamps!
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

Storage.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "storage",
    paranoid: true,
    timestamps: true,
    sequelize: sequelizeConnection,
  },
);
